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

// GET - Get messages in a group
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
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const cursor = url.searchParams.get("cursor");
  const type = url.searchParams.get("type");

  try {
    // Check if user is a member of this group
    const membership = await getUserMembership(groupId, session.user.id);
    
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build the query filters
    
    interface ContributionFilters {
        groupId: string;
        cycleId?: string;
        memberId?: string;
        status?: string;
      }
      
      const filters: ContributionFilters = { groupId };
    
    if (type) filters.type = type;

    // Pagination with cursor
    const messages = await prisma.message.findMany({
      where: filters,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { sentAt: 'desc' },
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
          where: {
            userId: session.user.id
          }
        }
      }
    });

    // Get the next cursor
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    // Mark messages as read
    const messageIds = messages
      .filter(msg => msg.readBy.length === 0)
      .map(msg => msg.id);
    
    if (messageIds.length > 0) {
      await prisma.$transaction(
        messageIds.map(messageId => 
          prisma.messageRead.create({
            data: {
              messageId,
              userId: session.user.id
            }
          })
        )
      );
    }

    return NextResponse.json({
      messages,
      nextCursor
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a new message to the group
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

    const { content, isAnnouncement, type, attachmentUrl, encryptedContent } = await request.json();

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Only admins and elders can make announcements
    if (isAnnouncement && membership.role !== "admin" && membership.role !== "elder") {
      return NextResponse.json(
        { error: "Only admins and elders can make announcements" },
        { status: 403 }
      );
    }

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        content,
        encryptedContent,
        senderId: membership.id,
        groupId,
        isAnnouncement: isAnnouncement || false,
        type: type || "text",
        attachmentUrl,
        // Mark as read by the sender
        readBy: {
          create: {
            userId: session.user.id
          }
        }
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

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}