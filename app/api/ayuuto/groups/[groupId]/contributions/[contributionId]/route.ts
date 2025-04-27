import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Decimal } from "@prisma/client/runtime/library";

// Helper function to check if user is a member of the group
async function getUserMembership(groupId: string, userId: string) {
  return prisma.ayuutoMember.findFirst({
    where: {
      groupId,
      userId
    }
  });
}

// Helper function to check if user is group admin
async function isGroupAdmin(groupId: string, userId: string) {
  const group = await prisma.ayuutoGroup.findFirst({
    where: {
      id: groupId,
      adminId: userId
    }
  });
  return !!group;
}

// GET - Get details of a specific contribution
export async function GET(
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

    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        member: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        cycle: {
          include: {
            recipient: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        verifications: {
          include: {
            verifier: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { verifiedAt: 'desc' }
        },
        group: {
          select: {
            name: true,
            contributionAmount: true
          }
        }
      }
    });

    if (!contribution || contribution.groupId !== groupId) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    return NextResponse.json(contribution);
  } catch (error) {
    console.error("Error fetching contribution details:", error);
    return NextResponse.json(
      { error: "Failed to fetch contribution details" },
      { status: 500 }
    );
  }
}

// PUT - Update contribution information
export async function PUT(
  request: Request,
  { params }: { params: { groupId: string; contributionId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, contributionId } = params;

  try {
    // Check if user is admin or the contributor
    const isAdmin = await isGroupAdmin(groupId, session.user.id);
    
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        member: true
      }
    });

    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    const isSelfContribution = contribution.member.userId === session.user.id;

    if (!isAdmin && !isSelfContribution) {
      return NextResponse.json(
        { error: "Only the contributor or admin can update this contribution" },
        { status: 403 }
      );
    }

    // Only allow updating certain fields based on status and role
    const { amount, status } = await request.json();
    
    // Only admin can change the status
    if (status && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can change contribution status" },
        { status: 403 }
      );
    }

    // Only allow amount changes if not verified
    if (amount && contribution.status === "verified") {
      return NextResponse.json(
        { error: "Cannot modify a verified contribution" },
        { status: 400 }
      );
    }

    // Update the contribution
    const updatedContribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        amount: amount ? new Decimal(amount) : undefined,
        status: status || undefined
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        verifications: true
      }
    });

    return NextResponse.json(updatedContribution);
  } catch (error) {
    console.error("Error updating contribution:", error);
    return NextResponse.json(
      { error: "Failed to update contribution" },
      { status: 500 }
    );
  }
}