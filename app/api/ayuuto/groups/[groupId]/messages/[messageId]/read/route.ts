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

// POST - Mark a message as read
export async function POST(
  request: Request,
  { params }: { params: { groupId: string; messageId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, messageId } = params;

  try {
    // Check if user is a member of this group
    const membership = await getUserMembership(groupId, session.user.id);
    
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if the message exists and belongs to this group
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message || message.groupId !== groupId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if message is already marked as read
    const existingRead = await prisma.messageRead.findFirst({
      where: {
        messageId,
        userId: session.user.id
      }
    });

    if (existingRead) {
      return NextResponse.json({ message: "Message already read" });
    }

    // Mark as read
    const readMarker = await prisma.messageRead.create({
      data: {
        messageId,
        userId: session.user.id
      }
    });

    return NextResponse.json(readMarker, { status: 201 });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}