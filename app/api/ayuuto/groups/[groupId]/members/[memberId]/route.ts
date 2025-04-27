import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

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

// GET - Get details of a specific member
export async function GET(
  request: Request,
  { params }: { params: { groupId: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, memberId } = params;

  try {
    // Check if the user is a member of this group
    const userMembership = await prisma.ayuutoMember.findFirst({
      where: {
        groupId,
        userId: session.user.id
      }
    });

    const isAdmin = await isGroupAdmin(groupId, session.user.id);

    if (!userMembership && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const member = await prisma.ayuutoMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            preferredLanguage: true
          }
        },
        contributions: {
          orderBy: { contributedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!member || member.groupId !== groupId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error fetching member details:", error);
    return NextResponse.json(
      { error: "Failed to fetch member details" },
      { status: 500 }
    );
  }
}

// PUT - Update member information or role
export async function PUT(
  request: Request,
  { params }: { params: { groupId: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, memberId } = params;

  try {
    // Check if user is admin
    const isAdmin = await isGroupAdmin(groupId, session.user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only group admin can update member information" },
        { status: 403 }
      );
    }

    const { role, cyclePosition } = await request.json();

    // Update the member
    const updatedMember = await prisma.ayuutoMember.update({
      where: { id: memberId },
      data: {
        role,
        cyclePosition
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a member from the group
export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, memberId } = params;

  try {
    // Check if user is admin
    const isAdmin = await isGroupAdmin(groupId, session.user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only group admin can remove members" },
        { status: 403 }
      );
    }

    // Get the member to check if they are the last one or if they have received funds
    const member = await prisma.ayuutoMember.findUnique({
      where: { id: memberId },
      include: {
        receivedFunds: true
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if they have received funds
    if (member.receivedFunds.length > 0) {
      return NextResponse.json(
        { error: "Cannot remove a member who has already received funds" },
        { status: 400 }
      );
    }

    // Delete the member
    await prisma.ayuutoMember.delete({
      where: { id: memberId }
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}