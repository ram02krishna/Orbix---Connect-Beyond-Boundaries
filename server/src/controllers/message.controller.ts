import type { Request, Response } from "express";
import * as messageService from "../services/message.service.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { io } from "../server.js";
import { SOCKET_EVENTS } from "../sockets/events.js";
import { prisma } from "../config/prisma.js";

// POST /api/messages/:chatId
// Send a text message
export async function sendMessage(req: Request, res: Response) {
  const { content, type, replyToId, attachments } = req.body;
  const message = await messageService.sendMessage(
    req.params.chatId as string,
    req.user!.id,
    content,
    type,
    replyToId,
    attachments
  );

  // Find members of this chat to broadcast the message to their user-specific rooms
  const chat = await prisma.chat.findUnique({
    where: { id: req.params.chatId as string },
    select: {
      members: {
        select: { userId: true }
      }
    }
  });

  if (chat) {
    for (const member of chat.members) {
      // Don't broadcast to users who have the message deleted (e.g. blockers)
      if (!message.deletedForUsers.includes(member.userId)) {
        io.to(`user:${member.userId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
      }
    }
  }

  sendSuccess(res, "Message sent", { message }, 201);
}

// GET /api/messages/:chatId
// Get messages for a chat (pass ?cursor=<messageId> for pagination)
export async function getMessages(req: Request, res: Response) {
  const cursor = req.query.cursor as string | undefined;
  const limit = Number(req.query.limit) || 30;

  const messages = await messageService.getChatMessages(
    req.params.chatId as string,
    req.user!.id,
    cursor,
    limit
  );
  sendSuccess(res, "Messages fetched", { messages });
}

// PATCH /api/messages/:messageId
// Edit a message
export async function editMessage(req: Request, res: Response) {
  const { content } = req.body;
  const message = await messageService.editMessage(req.params.messageId as string, req.user!.id, content);

  // Broadcast the edited message to the chat room
  io.to(`chat:${message.chatId}`).emit(SOCKET_EVENTS.MESSAGE_EDITED, message);

  sendSuccess(res, "Message edited", { message });
}

// DELETE /api/messages/:messageId
export async function deleteMessage(req: Request, res: Response) {
  const mode = (req.query.mode as "me" | "everyone") || "me";
  const message = await messageService.deleteMessage(req.params.messageId as string, req.user!.id, mode);

  if (mode === "everyone") {
    // Broadcast the deletion to the chat room so everyone updates
    io.to(`chat:${message.chatId}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
      messageId: message.id,
      chatId: message.chatId,
      mode: "everyone",
    });
  } else {
    // Notify only the user who deleted the message for themselves
    io.to(`user:${req.user!.id}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
      messageId: message.id,
      chatId: message.chatId,
      mode: "me",
    });
  }

  sendSuccess(res, mode === "everyone" ? "Message deleted for everyone" : "Message deleted for you");
}

// POST /api/messages/:messageId/react
// Add or remove a reaction (toggle)
export async function toggleReaction(req: Request, res: Response) {
  const { emoji } = req.body;
  const result = await messageService.toggleReaction(req.params.messageId as string, req.user!.id, emoji);

  // Find the chatId to broadcast to the room
  const message = await prisma.message.findUnique({
    where: { id: req.params.messageId as string },
    select: { chatId: true },
  });

  if (message) {
    io.to(`chat:${message.chatId}`).emit(SOCKET_EVENTS.REACTION_CHANGED, {
      messageId: req.params.messageId as string,
      userId: req.user!.id,
      emoji,
      action: result.action,
    });
  }

  sendSuccess(res, result.action === "added" ? "Reaction added" : "Reaction removed", result);
}

// POST /api/messages/:messageId/read
// Mark a message as read
export async function markAsRead(req: Request, res: Response) {
  const readReceipt = await messageService.markMessageRead(req.params.messageId as string, req.user!.id);

  // Find the chatId to broadcast to the room
  const message = await prisma.message.findUnique({
    where: { id: req.params.messageId as string },
    select: { chatId: true },
  });

  if (message) {
    io.to(`chat:${message.chatId}`).emit(SOCKET_EVENTS.MESSAGE_READ, {
      messageId: req.params.messageId as string,
      userId: req.user!.id,
      chatId: message.chatId,
      readAt: readReceipt.readAt,
    });
  }

  sendSuccess(res, "Marked as read");
}


