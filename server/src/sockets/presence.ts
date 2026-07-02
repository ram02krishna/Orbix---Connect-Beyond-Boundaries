import type { Server } from "socket.io";
import { redis } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { SOCKET_EVENTS } from "./events.js";

/**
 * Helper to fetch all unique user IDs that share a chat room with the target user.
 * These are the "partners" who need to be notified when the user's presence changes.
 */
async function getChatPartners(userId: string): Promise<string[]> {
  const cacheKey = `user:partners:${userId}`;
  const cached = await redis.get<string[]>(cacheKey);
  if (cached) return cached;

  const members = await prisma.chatMember.findMany({
    where: {
      chat: {
        members: {
          some: { userId },
        },
      },
      userId: { not: userId },
    },
    select: { userId: true },
  });
  
  const partners = [...new Set(members.map((m) => m.userId))];
  
  // Cache for 5 minutes to prevent DB spikes during reconnect storms
  await redis.set(cacheKey, partners, { ex: 300 });
  return partners;
}

/**
 * Handles marking a user online when they connect a new socket.
 * Uses a Redis counter to support multiple active tabs/devices per user.
 */
export async function handleUserConnect(userId: string, socketId: string, io: Server) {
  try {
    const connKey = `user:conn_count:${userId}`;
    const count = await redis.incr(connKey);

    // If this is the first active connection for this user
    if (count === 1) {
      await redis.sadd("online_users", userId);

      // Notify all chat partners that this user is now online
      const partners = await getChatPartners(userId);
      for (const partnerId of partners) {
        io.to(`user:${partnerId}`).emit(SOCKET_EVENTS.PRESENCE_CHANGE, {
          userId,
          status: "online",
        });
      }
    }

    // Always send the current online statuses of all partners to the newly connected socket
    const partners = await getChatPartners(userId);
    const partnerStatuses = await getOnlineStatuses(partners);
    for (const [partnerId, statusObj] of Object.entries(partnerStatuses)) {
      io.to(socketId).emit(SOCKET_EVENTS.PRESENCE_CHANGE, {
        userId: partnerId,
        status: statusObj.status,
        lastSeen: statusObj.lastSeen,
      });
    }
  } catch (error) {
    console.error(`Error in handleUserConnect for user ${userId}:`, error);
  }
}

/**
 * Handles marking a user offline when a socket disconnects.
 * Only marks the user as offline if they have no other active connections left.
 */
export async function handleUserDisconnect(userId: string, socketId: string, io: Server) {
  try {
    const connKey = `user:conn_count:${userId}`;
    const count = await redis.decr(connKey);

    // If no active connections are left, mark as offline
    if (count <= 0) {
      await redis.del(connKey);
      await redis.srem("online_users", userId);

      const lastSeen = new Date().toISOString();
      await redis.set(`user:last_seen:${userId}`, lastSeen);

      // Notify all chat partners that this user is now offline
      const partners = await getChatPartners(userId);
      for (const partnerId of partners) {
        io.to(`user:${partnerId}`).emit(SOCKET_EVENTS.PRESENCE_CHANGE, {
          userId,
          status: "offline",
          lastSeen,
        });
      }
    }
  } catch (error) {
    console.error(`Error in handleUserDisconnect for user ${userId}:`, error);
  }
}

/**
 * Fetches the online/offline status for a list of user IDs.
 */
export async function getOnlineStatuses(userIds: string[]): Promise<Record<string, { status: "online" | "offline"; lastSeen?: string | null }>> {
  const statuses: Record<string, { status: "online" | "offline"; lastSeen?: string | null }> = {};
  try {
    for (const id of userIds) {
      const isOnline = await redis.sismember("online_users", id);
      let lastSeen: string | null = isOnline ? null : (await redis.get(`user:last_seen:${id}`) as string | null);

      if (!isOnline && !lastSeen) {
        // Fallback to Prisma database session lastSeenAt
        const latestSession = await prisma.session.findFirst({
          where: { userId: id },
          orderBy: { lastSeenAt: "desc" },
          select: { lastSeenAt: true },
        });
        if (latestSession) {
          lastSeen = latestSession.lastSeenAt.toISOString();
          await redis.set(`user:last_seen:${id}`, lastSeen);
        }
      }

      statuses[id] = {
        status: isOnline ? "online" : "offline",
        lastSeen: lastSeen || null,
      };
    }
  } catch (error) {
    console.error("Error fetching online statuses from Redis/DB:", error);
  }
  return statuses;
}
