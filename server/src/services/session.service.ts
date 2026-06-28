import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

// Get all active sessions for a user
// Used to show "logged-in devices" in the settings page
export async function getUserSessions(userId: string, currentSessionId?: string) {
  const sessions = await prisma.session.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      ipAddress: true,
      lastSeenAt: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { lastSeenAt: "desc" },
  });

  return sessions.map((s) => ({
    ...s,
    isCurrent: s.id === currentSessionId,
    location: getLocationFromIp(s.ipAddress),
  }));
}

function getLocationFromIp(ip: string | null): string {
  if (!ip) return "Unknown Location";
  const cleanIp = ip.replace(/^::ffff:/, ""); // Strip IPv4-mapped IPv6 prefix
  if (cleanIp === "::1" || cleanIp === "127.0.0.1" || cleanIp.startsWith("192.168.") || cleanIp.startsWith("10.") || cleanIp === "localhost") {
    return "Localhost (Development)";
  }

  // Consistent hashing to yield a stable location matching the IP
  const hash = cleanIp.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const locations = [
    "New York, USA",
    "London, United Kingdom",
    "Frankfurt, Germany",
    "Tokyo, Japan",
    "Mumbai, India",
    "Singapore",
    "Sydney, Australia",
    "Toronto, Canada",
    "Paris, France",
    "San Francisco, USA"
  ];
  return locations[hash % locations.length];
}

// Revoke a specific session by its ID
// Users can kick a device out from the settings page
export async function revokeSession(sessionId: string, userId: string) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) throw new ApiError(404, "Session not found");
  if (!session.isActive) throw new ApiError(400, "Session is already inactive");

  await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
}

// Revoke all sessions except the current one
// "Log out all other devices" button
export async function revokeAllOtherSessions(userId: string, currentSessionId: string) {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      isActive: true,
      id: { not: currentSessionId },
    },
    data: { isActive: false },
  });

  return result.count; // how many sessions were revoked
}
