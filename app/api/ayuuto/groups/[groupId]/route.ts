import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// Helper function to check if user has access to the group
async function hasGroupAccess(groupId: string, userId: string) {
  const group = await prisma.ayuutoGroup.findFirst({
    where: {
      id: groupId,
      OR: [
        { adminId: userId },
        { members: { some: { userId } } }
      ]
    }
  });
  return !!group;
}

// GET - Get details of a specific group
export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  try {
    // Check if user has access to this group
    const hasAccess = await hasGroupAccess(groupId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const group = await prisma.ayuutoGroup.findUnique({
      where: { id: groupId },
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { cyclePosition: 'asc' }
        },
        cycles: {
          take: 1,
          orderBy: { cycleNumber: 'desc' },
          include: {
            recipient: {
              include: {
                user: {
                  select: { name: true }
                }
              }
            }
          }
        },
        _count: {
          select: { 
            members: true,
            cycles: true,
            contributions: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Remove private key from response for security
    const { privateKey, ...safeGroup } = group as any;
    return NextResponse.json(safeGroup);
  } catch (error) {
    console.error("Error fetching ayuuto group:", error);
    return NextResponse.json(
      { error: "Failed to fetch ayuuto group" },
      { status: 500 }
    );
  }
}

// PUT - Update group information
export async function PUT(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  try {
    // Check if user is the admin of this group
    const group = await prisma.ayuutoGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group admin can update group settings" },
        { status: 403 }
      );
    }

    const {
      name,
      description,
      contributionAmount,
      frequency,
      isActive
    } = await request.json();

    // Update the group
    const updatedGroup = await prisma.ayuutoGroup.update({
      where: { id: groupId },
      data: {
        name,
        description,
        contributionAmount,
        frequency,
        isActive
      }
    });

    // Remove private key from response
    const { privateKey, ...safeGroup } = updatedGroup as any;
    return NextResponse.json(safeGroup);
  } catch (error) {
    console.error("Error updating ayuuto group:", error);
    return NextResponse.json(
      { error: "Failed to update ayuuto group" },
      { status: 500 }
    );
  }
}

// DELETE - Archive or delete a group
export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  try {
    // Check if user is the admin of this group
    const group = await prisma.ayuutoGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the group admin can delete the group" },
        { status: 403 }
      );
    }

    // Instead of actually deleting, set to inactive for record-keeping
    await prisma.ayuutoGroup.update({
      where: { id: groupId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: "Group archived successfully" });
  } catch (error) {
    console.error("Error deleting ayuuto group:", error);
    return NextResponse.json(
      { error: "Failed to delete ayuuto group" },
      { status: 500 }
    );
  }
}