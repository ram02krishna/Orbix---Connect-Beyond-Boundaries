import type { Request, Response } from "express";
import * as chatService from "../services/chat.service.js";
import { markChatMessagesAsRead, sendMessage } from "../services/message.service.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { io } from "../server.js";
import { SOCKET_EVENTS } from "../sockets/events.js";
import { getOnlineStatuses } from "../sockets/presence.js";
import { prisma } from "../config/prisma.js";

// POST /api/chats/direct
// Start or open a DM with another user
export async function openDirectChat(req: Request, res: Response) {
  const { targetUserId } = req.body;
  const { chat, isNew } = await chatService.getOrCreateDirectChat(req.user!.id, targetUserId);
  
  // Fetch target user's online status
  const onlineStatuses = await getOnlineStatuses([targetUserId]);
  
  const myMembership = chat.members.find((m: any) => m.userId === req.user!.id);
  const mappedChat = {
    ...chat,
    myRole: myMembership?.role,
    isPinned: myMembership?.isPinned || false,
    mutedUntil: myMembership?.mutedUntil || null,
  };

  sendSuccess(res, isNew ? "Chat created" : "Chat opened", { chat: mappedChat, onlineStatuses }, isNew ? 201 : 200);
}

// POST /api/chats/group
// Create a new group chat
export async function createGroup(req: Request, res: Response) {
  const { title, memberIds, photoUrl } = req.body;
  const chat = await chatService.createGroupChat(req.user!.id, title, memberIds, photoUrl);
  
  const myMembership = chat.members.find((m: any) => m.userId === req.user!.id);
  const mappedChat = {
    ...chat,
    myRole: myMembership?.role,
    isPinned: myMembership?.isPinned || false,
    mutedUntil: myMembership?.mutedUntil || null,
  };

  // Create system message
  const creatorUser = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
  const creatorName = creatorUser?.name || "Someone";
  const systemMsg = await sendMessage(
    chat.id,
    req.user!.id,
    `${creatorName} created group "${title}"`,
    "SYSTEM"
  );
  
  // Broadcast message to all group members via their user rooms
  const uniqueMembers = [...new Set([req.user!.id, ...memberIds])];
  for (const memberId of uniqueMembers) {
    io.to(`user:${memberId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, systemMsg);
  }

  sendSuccess(res, "Group created", { chat: mappedChat }, 201);
}

// GET /api/chats
// Get all chats for the current user (their inbox)
export async function getMyChats(req: Request, res: Response) {
  const chats = await chatService.getUserChats(req.user!.id);
  
  // Extract all unique partner user IDs for direct chats to check their status
  const partnerIds = chats
    .map((chat: any) => {
      if (chat.type === "DIRECT") {
        const partner = chat.members.find((m: any) => m.userId !== req.user!.id)?.user;
        return partner?.id;
      }
      return null;
    })
    .filter(Boolean) as string[];

  let onlineStatuses: Record<string, any> = {};
  if (partnerIds.length > 0) {
    onlineStatuses = await getOnlineStatuses(partnerIds);
  }

  sendSuccess(res, "Chats fetched", { chats, onlineStatuses });
}

// GET /api/chats/:chatId
// Get a single chat by ID
export async function getChat(req: Request, res: Response) {
  const chat = await chatService.getChatById(req.params.chatId as string, req.user!.id);
  
  const myMembership = chat.members.find((m: any) => m.userId === req.user!.id);
  const mappedChat = {
    ...chat,
    myRole: myMembership?.role,
    isPinned: myMembership?.isPinned || false,
    mutedUntil: myMembership?.mutedUntil || null,
  };

  sendSuccess(res, "Chat fetched", { chat: mappedChat });
}

// PATCH /api/chats/:chatId
// Update a group chat's name or photo (admins only)
export async function updateChat(req: Request, res: Response) {
  const { title, photoUrl } = req.body;
  const chat = await chatService.updateGroupChat(req.params.chatId as string, req.user!.id, { title, photoUrl });
  sendSuccess(res, "Group updated", { chat });
}

// POST /api/chats/:chatId/members
// Add a member to a group chat
export async function addMember(req: Request, res: Response) {
  const { userId } = req.body;
  const member = await chatService.addMember(req.params.chatId as string, req.user!.id, userId);
  
  // Create system message
  const adderUser = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
  const addedUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const systemMsg = await sendMessage(
    req.params.chatId as string,
    req.user!.id,
    `${adderUser?.name || "Admin"} added ${addedUser?.name || "a user"}`,
    "SYSTEM"
  );

  // Broadcast message to all members in the chat
  const chat = await prisma.chat.findUnique({
    where: { id: req.params.chatId as string },
    select: { members: { select: { userId: true } } }
  });
  if (chat) {
    for (const m of chat.members) {
      io.to(`user:${m.userId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, systemMsg);
    }
  }

  sendSuccess(res, "Member added", { member }, 201);
}

// DELETE /api/chats/:chatId/members/:userId
// Remove a member (or leave the chat yourself)
export async function removeMember(req: Request, res: Response) {
  const chatId = req.params.chatId as string;
  const requesterId = req.user!.id;
  const targetUserId = req.params.userId as string;

  const removerUser = await prisma.user.findUnique({ where: { id: requesterId }, select: { name: true } });
  const removedUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } });

  await chatService.removeMember(chatId, requesterId, targetUserId);

  const isSelf = requesterId === targetUserId;
  const systemMsg = await sendMessage(
    chatId,
    requesterId,
    isSelf ? `${removedUser?.name || "A user"} left the group` : `${removerUser?.name || "Admin"} removed ${removedUser?.name || "a user"}`,
    "SYSTEM"
  );

  // Broadcast message to remaining members
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { members: { select: { userId: true } } }
  });
  if (chat) {
    for (const m of chat.members) {
      io.to(`user:${m.userId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, systemMsg);
    }
  }
  // Also notify the target user who was removed
  io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, systemMsg);
  io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CHAT_DELETED, { chatId });

  sendSuccess(res, "Member removed");
}

// PATCH /api/chats/:chatId/archive
// Toggle archive status for this chat
export async function toggleArchive(req: Request, res: Response) {
  const result = await chatService.toggleArchive(req.params.chatId as string, req.user!.id);
  sendSuccess(res, result.isArchived ? "Chat archived" : "Chat unarchived");
}

// PATCH /api/chats/:chatId/pin
// Toggle pin status for this chat
export async function togglePin(req: Request, res: Response) {
  const result = await chatService.togglePin(req.params.chatId as string, req.user!.id);
  sendSuccess(res, result.isPinned ? "Chat pinned" : "Chat unpinned");
}

// DELETE /api/chats/:chatId
export async function deleteChat(req: Request, res: Response) {
  const chatId = req.params.chatId as string;
  const mode = (req.query.mode as "me" | "everyone") || "me";

  const chat = await chatService.deleteChat(chatId, req.user!.id, mode);

  if (mode === "everyone") {
    // Notify all members via their user-specific rooms
    for (const member of chat.members) {
      io.to(`user:${member.userId}`).emit(SOCKET_EVENTS.CHAT_DELETED, { chatId });
    }
  } else {
    // Notify ONLY the user who deleted the chat
    io.to(`user:${req.user!.id}`).emit(SOCKET_EVENTS.CHAT_DELETED, { chatId });
  }

  sendSuccess(res, mode === "everyone" ? "Chat deleted for everyone" : "Chat deleted for you");
}

export async function markChatAsRead(req: Request, res: Response) {
  const chatId = req.params.chatId as string;
  const userId = req.user!.id;

  const readMessageIds = await markChatMessagesAsRead(chatId, userId);

  // Broadcast read status for each marked message to the chat room
  if (readMessageIds.length > 0) {
    const readAt = new Date();
    for (const messageId of readMessageIds) {
      io.to(`chat:${chatId}`).emit(SOCKET_EVENTS.MESSAGE_READ, {
        messageId,
        userId,
        chatId,
        readAt,
      });
    }
  }

  sendSuccess(res, "Chat marked as read", { count: readMessageIds.length });
}


