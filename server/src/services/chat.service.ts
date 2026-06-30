import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { decryptMessage, decryptDeterministic } from "./crypto.service.js";
import { redis } from "../config/redis.js";

function decryptChatMembers(chat: any) {
  if (chat && chat.members) {
    for (const member of chat.members) {
      if (member.user) {
        if (member.user.email) {
          member.user.email = decryptDeterministic(member.user.email);
        }
        if (member.user.phone) {
          member.user.phone = decryptDeterministic(member.user.phone);
        }
      }
    }
  }
  return chat;
}

// ─── Create or Get a Direct Chat ──────────────────────────────────────────────
// If two users already have a DM, return it — otherwise create one.

export async function getOrCreateDirectChat(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new ApiError(400, "You can't start a chat with yourself");
  }

  // Check if a direct chat already exists between these two users
  const existing = await prisma.chat.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true, phone: true } } },
      },
      lastMessage: {
        select: {
          id: true,
          content: true,
          type: true,
          createdAt: true,
          sender: { select: { id: true, name: true } },
          reads: { select: { userId: true, readAt: true } },
        },
      },
    },
  });

  if (existing) {
    console.log(`[getOrCreateDirectChat] Found existing direct chat ${existing.id} between ${userId} and ${targetUserId}`);
    // If the requester had previously deleted this chat, restore it!
    const myMembership = existing.members.find((m) => m.userId === userId);
    if (myMembership && myMembership.isDeleted) {
      console.log(`[getOrCreateDirectChat] Restoring deleted direct chat ${existing.id} for user ${userId}`);
      await prisma.chatMember.update({
        where: { id: myMembership.id },
        data: { isDeleted: false },
      });
      myMembership.isDeleted = false;
    }

    if (existing.lastMessage && existing.lastMessage.content) {
      existing.lastMessage.content = decryptMessage(existing.lastMessage.content);
    }
    decryptChatMembers(existing);
    return { chat: existing, isNew: false };
  }

  // Create a fresh direct chat
  const chat = await prisma.chat.create({
    data: {
      type: "DIRECT",
      createdBy: userId,
      members: {
        create: [
          { userId, role: "MEMBER" },
          { userId: targetUserId, role: "MEMBER" },
        ],
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true, phone: true } } },
      },
      lastMessage: true,
    },
  });

  decryptChatMembers(chat);
  await invalidateInboxCache([userId, targetUserId]);
  return { chat, isNew: true };
}

// ─── Create a Group Chat ──────────────────────────────────────────────────────

export async function createGroupChat(
  userId: string,
  title: string,
  memberIds: string[],
  photoUrl?: string
) {
  if (!title.trim()) throw new ApiError(400, "Group name is required");

  // Deduplicate and always include the creator
  const uniqueMembers = [...new Set([userId, ...memberIds])];

  if (uniqueMembers.length < 2) {
    throw new ApiError(400, "A group needs at least 2 members");
  }

  const chat = await prisma.chat.create({
    data: {
      type: "GROUP",
      title,
      photoUrl,
      createdBy: userId,
      members: {
        create: uniqueMembers.map((id) => ({
          userId: id,
          role: id === userId ? "OWNER" : "MEMBER",
        })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true, phone: true } } },
      },
    },
  });

  await invalidateInboxCache(uniqueMembers);
  return decryptChatMembers(chat);
}

// ─── Get All Chats for a User (their inbox) ───────────────────────────────────

export async function invalidateInboxCache(userIds: string[]) {
  const keys = userIds.map((id) => `inbox:${id}`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function getUserChats(userId: string) {
  const cacheKey = `inbox:${userId}`;
  const cached = await redis.get<any[]>(cacheKey);
  if (cached) return cached;

  const memberships = await prisma.chatMember.findMany({
    where: { userId, isDeleted: false },
    orderBy: { chat: { updatedAt: "desc" } },
    include: {
      chat: {
        include: {
          lastMessage: {
            select: {
              id: true,
              type: true,
              content: true,
              createdAt: true,
              sender: { select: { id: true, name: true } },
              reads: { select: { userId: true, readAt: true } },
            },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true, phone: true } },
            },
          },
        },
      },
    },
  });

  // Flatten the membership + chat data for easy use on the frontend
  const mappedChats = memberships.map((m) => {
    const chat = m.chat;
    if (chat.lastMessage && chat.lastMessage.content) {
      chat.lastMessage.content = decryptMessage(chat.lastMessage.content);
    }
    decryptChatMembers(chat);
    return {
      ...chat,
      myRole: m.role,
      isPinned: m.isPinned,
      isArchived: m.isArchived,
      mutedUntil: m.mutedUntil,
      isDeleted: m.isDeleted,
    };
  });

  await redis.set(cacheKey, mappedChats, { ex: 60 * 60 * 24 }); // Cache for 24h
  return mappedChats;
}

// ─── Get a Single Chat ────────────────────────────────────────────────────────

export async function getChatById(chatId: string, userId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true, phone: true } },
        },
      },
      lastMessage: {
        select: {
          id: true,
          content: true,
          type: true,
          createdAt: true,
          sender: { select: { id: true, name: true } },
          reads: { select: { userId: true, readAt: true } },
        },
      },
    },
  });

  if (!chat) throw new ApiError(404, "Chat not found");

  const isMember = chat.members.some((m) => m.userId === userId);
  if (!isMember) throw new ApiError(403, "You are not a member of this chat");

  if (chat.lastMessage && chat.lastMessage.content) {
    chat.lastMessage.content = decryptMessage(chat.lastMessage.content);
  }

  decryptChatMembers(chat);
  return chat;
}

// ─── Add a Member to a Group Chat ────────────────────────────────────────────

export async function addMember(chatId: string, requesterId: string, newUserId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { members: true },
  });

  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "GROUP") throw new ApiError(400, "You can only add members to group chats");

  const requester = chat.members.find((m) => m.userId === requesterId);
  if (!requester) throw new ApiError(403, "You are not in this chat");
  if (requester.role === "MEMBER") throw new ApiError(403, "Only admins and owners can add members");

  const alreadyMember = chat.members.some((m) => m.userId === newUserId);
  if (alreadyMember) throw new ApiError(400, "That user is already in this chat");

  return prisma.chatMember.create({
    data: { chatId, userId: newUserId, role: "MEMBER" },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });
}

// ─── Remove a Member from a Group Chat ───────────────────────────────────────

export async function removeMember(chatId: string, requesterId: string, targetUserId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { members: true },
  });

  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "GROUP") throw new ApiError(400, "You can't remove from a direct chat");

  const requester = chat.members.find((m) => m.userId === requesterId);
  if (!requester) throw new ApiError(403, "You are not in this chat");

  const target = chat.members.find((m) => m.userId === targetUserId);
  if (!target) throw new ApiError(404, "That user is not in this chat");

  const isSelf = requesterId === targetUserId;
  const canRemove =
    isSelf || requester.role === "ADMIN" || requester.role === "OWNER";

  if (!canRemove) throw new ApiError(403, "You don't have permission to remove this member");

  // Owners can't be removed by admins
  if (target.role === "OWNER" && !isSelf) {
    throw new ApiError(403, "The group owner can't be removed");
  }

  await prisma.chatMember.deleteMany({ where: { chatId, userId: targetUserId } });
}

// ─── Update Group Chat Info ───────────────────────────────────────────────────

export async function updateGroupChat(
  chatId: string,
  userId: string,
  data: { title?: string; photoUrl?: string }
) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { members: true },
  });

  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "GROUP") throw new ApiError(400, "You can only update group chats");

  const member = chat.members.find((m) => m.userId === userId);
  if (!member) throw new ApiError(403, "You are not in this chat");
  if (member.role === "MEMBER") throw new ApiError(403, "Only admins can update the group");

  return prisma.chat.update({ where: { id: chatId }, data });
}

// ─── Toggle Archive / Pin ─────────────────────────────────────────────────────

export async function toggleArchive(chatId: string, userId: string) {
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });

  if (!membership) throw new ApiError(403, "You are not in this chat");

  return prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data: { isArchived: !membership.isArchived },
  });
}

export async function togglePin(chatId: string, userId: string) {
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });

  if (!membership) throw new ApiError(403, "You are not in this chat");

  return prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data: { isPinned: !membership.isPinned },
  });
}

// ─── Delete a Chat ───────────────────────────────────────────────────────────
export async function deleteChat(chatId: string, userId: string, mode: "me" | "everyone") {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { members: true },
  });

  if (!chat) throw new ApiError(404, "Chat not found");

  const myMembership = chat.members.find((m) => m.userId === userId);
  if (!myMembership) throw new ApiError(403, "You are not a member of this chat");

  if (mode === "everyone") {
    // For group chats, restrict deletion for everyone to OWNER or ADMIN
    if (chat.type === "GROUP" && myMembership.role !== "OWNER" && myMembership.role !== "ADMIN") {
      throw new ApiError(403, "Only group owners or admins can delete the group chat for everyone");
    }

    // Delete the chat itself. Cascading relations in DB will clean up related records for everyone.
    await prisma.chat.delete({
      where: { id: chatId },
    });
  } else {
    // Soft-delete the chat for this user only by updating their membership
    await prisma.chatMember.update({
      where: { id: myMembership.id },
      data: { isDeleted: true },
    });
  }

  return chat;
}

