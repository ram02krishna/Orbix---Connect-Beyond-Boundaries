import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "./events.js";
import { prisma } from "../config/prisma.js";

/**
 * Registers chat-specific socket event handlers (joining rooms, typing status).
 */
export function registerChatHandlers(io: Server, socket: Socket) {
  // Grab the authenticated userId attached in the connection middleware
  const userId = (socket as any).userId;

  if (!userId) return;

  // ─── Join Chat Room ────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.JOIN_CHAT, async ({ chatId }: { chatId: string }) => {
    try {
      if (!chatId) return;

      // Security Check: Verify this user is a member of the chat
      const membership = await prisma.chatMember.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
      });

      if (!membership) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: "You are not a member of this chat" });
        return;
      }

      const roomName = `chat:${chatId}`;
      await socket.join(roomName);
    } catch (error) {
      console.error("Error joining socket room:", error);
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Failed to join chat room" });
    }
  });

  // ─── Leave Chat Room ───────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.LEAVE_CHAT, ({ chatId }: { chatId: string }) => {
    if (!chatId) return;
    const roomName = `chat:${chatId}`;
    void socket.leave(roomName);
  });

  // ─── Typing Status ─────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.TYPING_START, ({ chatId }: { chatId: string }) => {
    if (!chatId) return;
    // Broadcast typing event to everyone in the room except the sender
    socket.to(`chat:${chatId}`).emit(SOCKET_EVENTS.TYPING_START, {
      chatId,
      userId,
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, ({ chatId }: { chatId: string }) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
      chatId,
      userId,
    });
  });

  // ─── WebRTC Voice/Video Calling Signaling ─────────────────────────────────
  socket.on("call:initiate", async ({ targetUserId, fromUserId, fromUserName, fromUserAvatar, sdp, callType }: any) => {
    if (!targetUserId) return;

    // Check for blocks
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: fromUserId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: fromUserId }
        ]
      }
    });

    if (block) {
      // Silently ignore the call initiation (mimics WhatsApp behavior)
      return;
    }

    io.to(`user:${targetUserId}`).emit("call:incoming", {
      fromUserId,
      fromUserName,
      fromUserAvatar,
      sdp,
      callType
    });
  });

  socket.on("call:accept", ({ targetUserId, sdp }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:answered", {
      sdp
    });
  });

  socket.on("call:decline", ({ targetUserId }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:declined");
  });

  socket.on("call:hangup", ({ targetUserId }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:ended");
  });

  socket.on("call:ice-candidate", ({ targetUserId, candidate }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:ice-candidate", {
      candidate
    });
  });
}
