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

// GET - List all cycles in a group
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
    // Check if user is a member of this group
    const memberCheck = await prisma.ayuutoMember.findFirst({
      where: {
        groupId,
        userId: session.user.id
      }
    });

    const isAdmin = await isGroupAdmin(groupId, session.user.id);

    if (!memberCheck && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const cycles = await prisma.ayuutoCycle.findMany({
      where: { groupId },
      include: {
        recipient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: { contributions: true }
        }
      },
      orderBy: { cycleNumber: 'desc' }
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error("Error fetching cycles:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycles" },
      { status: 500 }
    );
  }
}

// POST - Create a new cycle
export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  try {
    // Check if user is admin
    const isAdmin = await isGroupAdmin(groupId, session.user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only group admin can create cycles" },
        { status: 403 }
      );
    }

    const { recipientId, startDate, endDate } = await request.json();

    // Validate required fields
    if (!recipientId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the group to check current cycle
    const group = await prisma.ayuutoGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if the recipient is a member of this group
    const recipient = await prisma.ayuutoMember.findFirst({
      where: {
        id: recipientId,
        groupId
      }
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient must be a member of this group" },
        { status: 400 }
      );
    }

    // Create the new cycle
    const newCycle = await prisma.ayuutoCycle.create({
      data: {
        cycleNumber: group.currentCycle,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "active",
        recipientId,
        groupId
      },
      include: {
        recipient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Update the group's current cycle
    await prisma.ayuutoGroup.update({
      where: { id: groupId },
      data: {
        currentCycle: group.currentCycle + 1
      }
    });

    return NextResponse.json(newCycle, { status: 201 });
  } catch (error) {
    console.error("Error creating cycle:", error);
    return NextResponse.json(
      { error: "Failed to create cycle" },
      { status: 500 }
    );
  }
}