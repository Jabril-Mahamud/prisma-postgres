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

// Helper function to check if user is a member of the group
async function getUserMembership(groupId: string, userId: string) {
  return prisma.ayuutoMember.findFirst({
    where: {
      groupId,
      userId
    }
  });
}

// GET - Get a specific message
export async function GET(
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

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        readBy: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { readAt: 'asc' }
        }
      }
    });

    if (!message || message.groupId !== groupId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Mark as read if not already
    const hasRead = message.readBy.some(read => read.userId === session.user.id);
    
    if (!hasRead) {
      await prisma.messageRead.create({
        data: {
          messageId,
          userId: session.user.id
        }
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

// PUT - Update a message
export async function PUT(
  request: Request,
  { params }: { params: { groupId: string; messageId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, messageId } = params;

  try {
    // Get the message to check ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true
      }
    });

    if (!message || message.groupId !== groupId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is the sender or an admin
    const isAdmin = await isGroupAdmin(groupId, session.user.id);
    const isSender = message.sender.userId === session.user.id;

    if (!isAdmin && !isSender) {
      return NextResponse.json(
        { error: "You cannot edit this message" },
        { status: 403 }
      );
    }

    const { content, encryptedContent } = await request.json();

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        encryptedContent
      },
      include: {
        sender: {
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

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a message
export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string; messageId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, messageId } = params;

  try {
    // Get the message to check ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true
      }
    });

    if (!message || message.groupId !== groupId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is the sender or an admin
    const isAdmin = await isGroupAdmin(groupId, session.user.id);
    const isSender = message.sender.userId === session.user.id;

    if (!isAdmin && !isSender) {
      return NextResponse.json(
        { error: "You cannot delete this message" },
        { status: 403 }
      );
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId }
    });

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}