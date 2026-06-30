import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import type { MessageType } from "@prisma/client";
import { encryptMessage, decryptMessage } from "./crypto.service.js";
import { redis } from "../config/redis.js";
import { invalidateInboxCache } from "./chat.service.js";

function decryptMessageObj(message: any) {
  if (!message) return message;
  if (message.content) {
    message.content = decryptMessage(message.content);
  }
  if (message.replyTo && message.replyTo.content) {
    message.replyTo.content = decryptMessage(message.replyTo.content);
  }
  return message;
}

// Reusable include shape so we always return messages in the same format
const messageInclude = {
  sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      type: true,
      sender: { select: { id: true, name: true } },
    },
  },
  attachments: true,
  reactions: {
    include: { user: { select: { id: true, name: true } } },
  },
  reads: { select: { userId: true, readAt: true } },
} as const;

// ─── Send a Message ───────────────────────────────────────────────────────────

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  type: MessageType = "TEXT",
  replyToId?: string,
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    mimeType: string;
    thumbUrl?: string | null;
  }>
) {
  // Fetch chat and check membership
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { members: true }
  });
  if (!chat) throw new ApiError(404, "Chat not found");

  const membership = chat.members.find(m => m.userId === senderId);
  if (!membership) throw new ApiError(403, "You are not in this chat");

  if (chat.type === "GROUP" && chat.restrictMessagingToAdmins && type !== "SYSTEM" && membership.role === "MEMBER") {
    throw new ApiError(403, "Only admins can send messages in this group");
  }

  // If it's a direct chat, check for blocks
  let receiverBlockedMe = false;
  let iBlockedReceiver = false;
  
  if (chat.type === "DIRECT") {
    const partner = chat.members.find(m => m.userId !== senderId);
    if (partner) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: partner.userId },
            { blockerId: partner.userId, blockedId: senderId }
          ]
        }
      });
      
      if (block) {
        if (block.blockerId === senderId) {
          iBlockedReceiver = true;
          throw new ApiError(403, "You cannot send messages to this user");
        } else {
          receiverBlockedMe = true;
        }
      }
    }
  }

  // Validate the replied-to message if given
  if (replyToId) {
    const original = await prisma.message.findFirst({ where: { id: replyToId, chatId } });
    if (!original) throw new ApiError(404, "The message you're replying to doesn't exist");
  }

  // Create the message, then update the chat's lastMessage in one go
  const message = await prisma.message.create({
    data: {
      chatId,
      senderId,
      content: content ? encryptMessage(content) : content,
      type,
      replyToId,
      deletedForUsers: receiverBlockedMe && chat.members.find(m => m.userId !== senderId) 
        ? [chat.members.find(m => m.userId !== senderId)!.userId] 
        : [],
      ...(attachments && attachments.length > 0 && {
        attachments: {
          create: attachments.map((att) => ({
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
            fileUrl: att.fileUrl,
            mimeType: att.mimeType,
            thumbUrl: att.thumbUrl,
          })),
        },
      }),
    },
    include: messageInclude,
  });

  // Update chat's lastMessage and updatedAt so it sorts correctly in the inbox
  await prisma.chat.update({
    where: { id: chatId },
    data: { lastMessageId: message.id, updatedAt: new Date() },
  });

  // Restore the chat for any member who had deleted/hidden it, so they see the new message
  await prisma.chatMember.updateMany({
    where: { chatId, isDeleted: true },
    data: { isDeleted: false },
  });

  // Invalidate caches
  const allMemberIds = chat.members.map(m => m.userId);
  await invalidateInboxCache(allMemberIds);
  const messageKeys = allMemberIds.map(id => `messages:${chatId}:${id}`);
  if (messageKeys.length > 0) await redis.del(...messageKeys);

  return decryptMessageObj(message);
}

// ─── Get Messages (Cursor-based Pagination) ───────────────────────────────────
// Returns messages oldest→newest, 30 at a time.
// Pass `cursor` (the ID of the oldest message you already have) to load more.

export async function getChatMessages(
  chatId: string,
  userId: string,
  cursor?: string,
  limit = 30
) {
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  if (!membership) throw new ApiError(403, "You are not in this chat");

  const cacheKey = `messages:${chatId}:${userId}`;
  if (!cursor && limit === 30) {
    const cached = await redis.get<any[]>(cacheKey);
    if (cached) return cached;
  }

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      NOT: { deletedForUsers: { has: userId } },
    },
    take: limit,
    // If a cursor was given, skip it and fetch `limit` records before it
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { createdAt: "desc" }, // fetch newest first, then reverse
    include: messageInclude,
  });

  const result = messages.map(decryptMessageObj).reverse(); // return decrypted oldest→newest
  
  if (!cursor && limit === 30) {
    await redis.set(cacheKey, result, { ex: 60 * 60 * 24 });
  }
  
  return result;
}

// ─── Edit a Message ───────────────────────────────────────────────────────────

export async function editMessage(messageId: string, userId: string, newContent: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message) throw new ApiError(404, "Message not found");
  if (message.senderId !== userId) throw new ApiError(403, "You can only edit your own messages");
  if (message.deletedAt) throw new ApiError(400, "You can't edit a deleted message");
  if (message.type !== "TEXT") throw new ApiError(400, "Only text messages can be edited");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: encryptMessage(newContent), editedAt: new Date() },
    include: messageInclude,
  });

  // Invalidate cache
  const chat = await prisma.chat.findUnique({ where: { id: message.chatId }, include: { members: true } });
  if (chat) {
    const memberIds = chat.members.map(m => m.userId);
    const messageKeys = memberIds.map(id => `messages:${message.chatId}:${id}`);
    if (messageKeys.length > 0) await redis.del(...messageKeys);
  }

  return decryptMessageObj(updated);
}

// ─── Soft-Delete a Message ────────────────────────────────────────────────────
// We keep the message row but clear the content and set deletedAt.
// This way "Message deleted" can still be shown in the UI.

export async function deleteMessage(messageId: string, userId: string, mode: "me" | "everyone") {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message) throw new ApiError(404, "Message not found");

  let updated;
  if (mode === "everyone") {
    if (message.senderId !== userId) throw new ApiError(403, "You can only delete your own messages for everyone");
    if (message.deletedAt) throw new ApiError(400, "Message is already deleted");

    updated = await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: null },
    });
  } else {
    // Mode is "me"
    // Push the userId to the deletedForUsers array so it's hidden for them
    updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedForUsers: {
          push: userId,
        },
      },
    });
  }

  // Invalidate cache
  const chat = await prisma.chat.findUnique({ where: { id: message.chatId }, include: { members: true } });
  if (chat) {
    const memberIds = chat.members.map(m => m.userId);
    const messageKeys = memberIds.map(id => `messages:${message.chatId}:${id}`);
    if (messageKeys.length > 0) await redis.del(...messageKeys);
    await invalidateInboxCache(memberIds);
  }
  
  return updated;
}

// ─── Toggle a Reaction ────────────────────────────────────────────────────────
// If the user already reacted with this emoji, remove it. Otherwise, add it.

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const existing = await prisma.reaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { action: "removed" as const, emoji };
  }

  await prisma.reaction.create({ data: { messageId, userId, emoji } });
  return { action: "added" as const, emoji };
}

// ─── Mark Messages as Read ────────────────────────────────────────────────────

export async function markMessageRead(messageId: string, userId: string) {
  return prisma.messageRead.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { messageId, userId },
    update: { readAt: new Date() },
  });
}

export async function markChatMessagesAsRead(chatId: string, userId: string) {
  const unreadMessages = await prisma.message.findMany({
    where: {
      chatId,
      senderId: { not: userId },
      reads: {
        none: { userId },
      },
    },
    select: { id: true },
  });

  if (unreadMessages.length > 0) {
    await prisma.messageRead.createMany({
      data: unreadMessages.map((m) => ({
        messageId: m.id,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  return unreadMessages.map((m) => m.id);
}
