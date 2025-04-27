import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// Helper function to check if user is a member of the group
async function getUserMembership(groupId: string, userId: string) {
  return prisma.ayuutoMember.findFirst({
    where: {
      groupId,
      userId
    }
  });
}

// POST - Verify a contribution
export async function POST(
  request: Request,
  { params }: { params: { groupId: string; contributionId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, contributionId } = params;

  try {
    // Check if user is a member of this group
    const membership = await getUserMembership(groupId, session.user.id);
    
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { method, notes } = await request.json();

    // Check if the contribution exists and belongs to this group
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        verifications: true,
        member: true
      }
    });

    if (!contribution || contribution.groupId !== groupId) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    // Prevent self-verification unless it's the initial recording
    if (contribution.member.userId === session.user.id && contribution.verifications.length > 0) {
      return NextResponse.json(
        { error: "You cannot verify your own contribution" },
        { status: 400 }
      );
    }

    // Check if the user has already verified this contribution
    const alreadyVerified = contribution.verifications.some(
      v => v.verifierId === session.user.id
    );

    if (alreadyVerified) {
      return NextResponse.json(
        { error: "You have already verified this contribution" },
        { status: 400 }
      );
    }

    // Create the verification
    const verification = await prisma.verification.create({
      data: {
        verifierId: session.user.id,
        contributionId,
        method: method || "digital",
        notes
      },
      include: {
        verifier: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // If this is the second verification or more, update the contribution status
    if (contribution.verifications.length >= 1) {
      await prisma.contribution.update({
        where: { id: contributionId },
        data: { status: "verified" }
      });
    } else {
      await prisma.contribution.update({
        where: { id: contributionId },
        data: { status: "confirmed" }
      });
    }

    return NextResponse.json(verification, { status: 201 });
  } catch (error) {
    console.error("Error verifying contribution:", error);
    return NextResponse.json(
      { error: "Failed to verify contribution" },
      { status: 500 }
    );
  }
}