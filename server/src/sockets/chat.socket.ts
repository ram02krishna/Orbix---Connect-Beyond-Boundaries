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

  // ─── WebRTC Voice/Video Calling Signaling (1-to-1) ────────────────────────
  socket.on("call:initiate", async (payload: any) => {
    try {
      const { targetUserId, fromUserName, fromUserAvatar, sdp, callType } = payload;
      if (!targetUserId) return;
      
      const fromUserId = userId; // Use secure userId from socket

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
        return;
      }

      io.to(`user:${targetUserId}`).emit("call:incoming", {
        fromUserId,
        fromUserName,
        fromUserAvatar,
        sdp,
        callType
      });
    } catch (err) {
      console.error("Error in call:initiate:", err);
    }
  });

  socket.on("call:accept", ({ targetUserId, sdp }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:answered", { sdp });
  });

  socket.on("call:decline", ({ targetUserId }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:declined");
  });

  socket.on("call:hangup", ({ targetUserId }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:ended");
  });

  socket.on("call:ice-candidate", ({ targetUserId, candidate, fromUserId: customFromUserId }: any) => {
    if (!targetUserId) return;
    // Pass fromUserId to identify who sent the candidate in group calls
    io.to(`user:${targetUserId}`).emit("call:ice-candidate", {
      candidate,
      fromUserId: customFromUserId || userId
    });
  });

  // ─── WebRTC Group Calling Signaling (Mesh) ───────────────────────────────
  socket.on("call:initiate-group", async (payload: any) => {
    try {
      const { chatId, fromUserName, fromUserAvatar, callType } = payload;
      if (!chatId) return;
      
      const fromUserId = userId;

      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          title: true,
          photoUrl: true,
          members: { select: { userId: true } }
        }
      });

      if (chat) {
        for (const member of chat.members) {
          if (member.userId !== fromUserId) {
            io.to(`user:${member.userId}`).emit("call:incoming-group", {
              chatId,
              chatTitle: chat.title,
              chatAvatar: chat.photoUrl,
              fromUserId,
              fromUserName,
              fromUserAvatar,
              callType
            });
          }
        }
      }
    } catch (err) {
      console.error("Error in call:initiate-group:", err);
    }
  });

  socket.on("call:join-group", async ({ chatId }: any) => {
    if (!chatId) return;
    // Broadcast to the chat room that someone joined the call
    // Note: the sender is already in the `chat:${chatId}` room.
    socket.to(`chat:${chatId}`).emit("call:participant-joined", {
      userId
    });
  });

  socket.on("call:leave-group", ({ chatId }: any) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit("call:participant-left", {
      userId
    });
  });

  // Signaling for mesh networking
  socket.on("call:offer", ({ targetUserId, sdp, callType }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:offer", {
      fromUserId: userId,
      sdp,
      callType
    });
  });

  socket.on("call:answer", ({ targetUserId, sdp }: any) => {
    if (!targetUserId) return;
    io.to(`user:${targetUserId}`).emit("call:answer", {
      fromUserId: userId,
      sdp
    });
  });
}
