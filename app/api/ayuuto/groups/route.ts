import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// GET - List all ayuuto groups the user is part of
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all groups where the user is a member or admin
    const userGroups = await prisma.ayuutoGroup.findMany({
      where: {
        OR: [
          { adminId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        admin: {
          select: { name: true, email: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    return NextResponse.json(userGroups);
  } catch (error) {
    console.error("Error fetching ayuuto groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch ayuuto groups" },
      { status: 500 }
    );
  }
}

// POST - Create a new ayuuto group
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      name, 
      description, 
      contributionAmount, 
      frequency, 
      totalMembers 
    } = await request.json();

    // Validate required fields
    if (!name || !contributionAmount || !frequency || !totalMembers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate encryption keys for the group (in a real app, use a library for this)
    const privateKey = `priv_${Math.random().toString(36).substring(2, 15)}`;
    const publicKey = `pub_${Math.random().toString(36).substring(2, 15)}`;

    // Create the group
    const newGroup = await prisma.ayuutoGroup.create({
      data: {
        name,
        description,
        contributionAmount,
        frequency,
        totalMembers,
        adminId: session.user.id,
        privateKey,
        publicKey,
        // Automatically add the creator as a member with admin role
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
            cyclePosition: 1
          }
        }
      },
      include: {
        admin: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Error creating ayuuto group:", error);
    return NextResponse.json(
      { error: "Failed to create ayuuto group" },
      { status: 500 }
    );
  }
}