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

// GET - List all members in a group
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
    // First check if user has access to this group
    const memberCheck = await prisma.ayuutoMember.findFirst({
      where: {
        groupId,
        userId: session.user.id
      }
    });

    if (!memberCheck && !(await isGroupAdmin(groupId, session.user.id))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const members = await prisma.ayuutoMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            preferredLanguage: true
          }
        },
        _count: {
          select: { contributions: true }
        }
      },
      orderBy: { cyclePosition: 'asc' }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    return NextResponse.json(
      { error: "Failed to fetch group members" },
      { status: 500 }
    );
  }
}

// POST - Add a new member to a group
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
    // Check if user is the admin or has elder status
    const userMembership = await prisma.ayuutoMember.findFirst({
      where: {
        groupId,
        userId: session.user.id,
        OR: [
          { role: "admin" },
          { role: "elder" }
        ]
      }
    });

    const isAdmin = await isGroupAdmin(groupId, session.user.id);

    if (!userMembership && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins and elders can add members" },
        { status: 403 }
      );
    }

    const { email, role, cyclePosition } = await request.json();

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. They must register first." },
        { status: 404 }
      );
    }

    // Check if the user is already a member
    const existingMember = await prisma.ayuutoMember.findFirst({
      where: {
        groupId,
        userId: user.id
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this group" },
        { status: 400 }
      );
    }

    // Find the current highest cycle position
    const highestPosition = await prisma.ayuutoMember.findFirst({
      where: { groupId },
      orderBy: { cyclePosition: 'desc' }
    });

    const nextPosition = highestPosition ? highestPosition.cyclePosition + 1 : 1;

    // Add the member
    const newMember = await prisma.ayuutoMember.create({
      data: {
        userId: user.id,
        groupId,
        role: role || "member",
        cyclePosition: cyclePosition || nextPosition
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

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error adding group member:", error);
    return NextResponse.json(
      { error: "Failed to add group member" },
      { status: 500 }
    );
  }
}