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

// GET - Get details of a specific cycle
export async function GET(
  request: Request,
  { params }: { params: { groupId: string; cycleId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, cycleId } = params;

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

    const cycle = await prisma.ayuutoCycle.findUnique({
      where: { id: cycleId },
      include: {
        recipient: {
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
        contributions: {
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
            verifications: {
              include: {
                verifier: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        group: {
          select: {
            name: true,
            contributionAmount: true
          }
        }
      }
    });

    if (!cycle || cycle.groupId !== groupId) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    return NextResponse.json(cycle);
  } catch (error) {
    console.error("Error fetching cycle details:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycle details" },
      { status: 500 }
    );
  }
}

// PUT - Update cycle information
export async function PUT(
  request: Request,
  { params }: { params: { groupId: string; cycleId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, cycleId } = params;

  try {
    // Check if user is admin
    const isAdmin = await isGroupAdmin(groupId, session.user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only group admin can update cycles" },
        { status: 403 }
      );
    }

    const { status, endDate } = await request.json();

    // Update the cycle
    const updatedCycle = await prisma.ayuutoCycle.update({
      where: { id: cycleId },
      data: {
        status,
        endDate: endDate ? new Date(endDate) : undefined
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

    return NextResponse.json(updatedCycle);
  } catch (error) {
    console.error("Error updating cycle:", error);
    return NextResponse.json(
      { error: "Failed to update cycle" },
      { status: 500 }
    );
  }
}