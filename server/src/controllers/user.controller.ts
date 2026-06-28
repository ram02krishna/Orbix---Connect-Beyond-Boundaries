import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { decryptDeterministic } from "../services/crypto.service.js";

// GET /api/users/me
// Returns the currently logged-in user's profile
export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      avatarUrl: true,
      bio: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
    },
  });

  if (!user) throw new ApiError(404, "User not found");

  user.email = decryptDeterministic(user.email);
  user.phone = decryptDeterministic(user.phone);

  sendSuccess(res, "Profile fetched", { user });
}

// PATCH /api/users/me
// Update name, bio, or avatarUrl
export async function updateMe(req: Request, res: Response) {
  const { name, bio, avatarUrl, username } = req.body;

  // If they want to change username, make sure it's not taken
  if (username) {
    const taken = await prisma.user.findFirst({
      where: { username, id: { not: req.user!.id } },
    });
    if (taken) throw new ApiError(409, "That username is already taken");
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl && { avatarUrl }),
      ...(username && { username }),
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
    },
  });

  updated.email = decryptDeterministic(updated.email);

  sendSuccess(res, "Profile updated", { user: updated });
}

// GET /api/users/search?q=john
// Search for users by name or username (excludes self + blocked users)
export async function searchUsers(req: Request, res: Response) {
  const q = (req.query.q as string)?.trim();

  if (!q || q.length < 2) {
    sendSuccess(res, "Search results", { users: [] });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: req.user!.id },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
      // Exclude users who have blocked us or whom we've blocked
      blocksGiven: { none: { blockedId: req.user!.id } },
      blocksGot: { none: { blockerId: req.user!.id } },
    },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
    take: 20,
  });

  sendSuccess(res, "Search results", { users });
}

// GET /api/users/:username
// Get a public profile by username
export async function getUserByUsername(req: Request, res: Response) {
  const username = req.params.username as string;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) throw new ApiError(404, "User not found");

  sendSuccess(res, "User profile", { user });
}

// POST /api/users/block/:userId
// Block a user
export async function blockUser(req: Request, res: Response) {
  const blockerId = req.user!.id;
  const blockedId = req.params.userId as string;

  if (blockerId === blockedId) throw new ApiError(400, "You can't block yourself");

  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new ApiError(404, "User not found");

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });

  sendSuccess(res, "User blocked");
}

// DELETE /api/users/block/:userId
// Unblock a user
export async function unblockUser(req: Request, res: Response) {
  const blockerId = req.user!.id;
  const blockedId = req.params.userId as string;

  await prisma.block.deleteMany({ where: { blockerId, blockedId } });

  sendSuccess(res, "User unblocked");
}

// GET /api/users/blocked
// Get the list of users the current user has blocked
export async function getBlockedUsers(req: Request, res: Response) {
  const blocks = await prisma.block.findMany({
    where: { blockerId: req.user!.id },
    include: {
      blocked: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  sendSuccess(res, "Blocked users", { users: blocks.map((b: { blocked: any }) => b.blocked) });
}
