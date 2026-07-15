import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { SOCKET_EVENTS } from "./events.js";
import { handleUserConnect, handleUserDisconnect } from "./presence.js";
import { setupChatSockets } from "./chat.socket.js";

export function initializeSockets(io: Server) {
  // check JWT token before letting the socket connect
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== "string") {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const rawToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
      const payload = jwt.verify(rawToken, env.JWT_SECRET) as { id: string; email: string };

      (socket as any).userId = payload.id;
      (socket as any).email = payload.email;

      next();
    } catch (err) {
      console.error("Socket auth failed:", err);
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on(SOCKET_EVENTS.CONNECTION, async (socket: Socket) => {
    const userId = (socket as any).userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // join a user-specific room so we can send direct events to this user
    await socket.join(`user:${userId}`);

    // mark user as online and notify their contacts
    await handleUserConnect(userId, socket.id, io);

    // set up chat room / message / call handlers
    setupChatSockets(io, socket);

    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      await handleUserDisconnect(userId, socket.id, io);
    });
  });
}
