import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { SOCKET_EVENTS } from "./events.js";
import { handleUserConnect, handleUserDisconnect } from "./presence.js";
import { registerChatHandlers } from "./chat.socket.js";

/**
 * Initializes the Socket.IO server, configures authentication middleware,
 * and sets up presence / event listeners.
 */
export function initializeSockets(io: Server) {
  // Middleware: Authenticate incoming socket connections using the JWT access token
  io.use((socket: Socket, next) => {
    // Check token from auth payload or query parameters
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== "string") {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      // The token can be prefixed with "Bearer " (similar to HTTP headers) or be raw
      const rawToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

      const payload = jwt.verify(rawToken, env.JWT_ACCESS_SECRET) as {
        id: string;
        email: string;
      };

      // Attach user information to the socket for easy access in handlers
      (socket as any).userId = payload.id;
      (socket as any).email = payload.email;

      next();
    } catch (err) {
      console.error("Socket authentication failed:", err);
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  // Connection Handler
  io.on(SOCKET_EVENTS.CONNECTION, async (socket: Socket) => {
    const userId = (socket as any).userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // 1. Join user-specific notification room
    // This allows sending personal events to a specific user (regardless of their active socket connection)
    // by using: io.to(`user:${userId}`).emit(...)
    const userRoomName = `user:${userId}`;
    await socket.join(userRoomName);

    // 2. Mark user as online in Redis and notify their chat partners
    await handleUserConnect(userId, socket.id, io);

    // 3. Register chat-specific handlers (joining rooms, typing)
    registerChatHandlers(io, socket);

    // 4. Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      await handleUserDisconnect(userId, socket.id, io);
    });
  });
}
