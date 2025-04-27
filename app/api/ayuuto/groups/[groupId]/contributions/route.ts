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

// GET - List all contributions in a group
export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;
  const url = new URL(request.url);
  const cycleId = url.searchParams.get("cycleId");
  const memberId = url.searchParams.get("memberId");
  const status = url.searchParams.get("status");

  try {
    // Check if user is a member of this group
    const membership = await getUserMembership(groupId, session.user.id);
    
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    interface ContributionFilters {
        groupId: string;
        cycleId?: string;
        memberId?: string;
        status?: string;
      }
      
      const filters: ContributionFilters = { groupId };
    
    if (cycleId) filters.cycleId = cycleId;
    if (memberId) filters.memberId = memberId;
    if (status) filters.status = status;

    const contributions = await prisma.contribution.findMany({
      where: filters,
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
        cycle: {
          select: {
            cycleNumber: true,
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
          }
        }
      },
      orderBy: { contributedAt: 'desc' }
    });

    return NextResponse.json(contributions);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    );
  }
}

// POST - Record a new contribution
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
    // Check if user is a member of this group
    const membership = await getUserMembership(groupId, session.user.id);
    
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { amount, cycleId, memberId } = await request.json();

    // Validate required fields
    if (!amount || !cycleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine which member is making the contribution
    // If memberId is provided, an admin or elder is recording for someone else
    // Otherwise, the logged in user is recording their own contribution
    const contributorId = memberId || membership.id;

    // Get the group to check the contribution amount
    const group = await prisma.ayuutoGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if this is a valid cycle
    const cycle = await prisma.ayuutoCycle.findFirst({
      where: {
        id: cycleId,
        groupId
      }
    });

    if (!cycle) {
      return NextResponse.json(
        { error: "Invalid cycle for this group" },
        { status: 400 }
      );
    }

    // Create the contribution
    const newContribution = await prisma.contribution.create({
      data: {
        amount: new Decimal(amount),
        memberId: contributorId,
        groupId,
        cycleId,
        status: "pending",
        // If the user is recording their own contribution, create a self-verification
        verifications: memberId ? undefined : {
          create: {
            verifierId: session.user.id,
            method: "digital",
            notes: "Self-recorded contribution"
          }
        }
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
    });

    return NextResponse.json(newContribution, { status: 201 });
  } catch (error) {
    console.error("Error recording contribution:", error);
    return NextResponse.json(
      { error: "Failed to record contribution" },
      { status: 500 }
    );
  }
}