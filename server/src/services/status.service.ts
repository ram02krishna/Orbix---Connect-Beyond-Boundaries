import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

interface CreateStatusInput {
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  caption?: string;
  backgroundColor?: string;
}

export async function createStatus(userId: string, input: CreateStatusInput) {
  if (!input.content && !input.mediaUrl) {
    throw new ApiError(400, "Status must contain text content or a media file");
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return prisma.status.create({
    data: {
      userId,
      content: input.content,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      caption: input.caption,
      backgroundColor: input.backgroundColor,
      expiresAt,
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
    },
  });
}

export async function getStatuses(userId: string) {
  // 1. Fetch direct chat partner user IDs
  const myDirectChats = await prisma.chatMember.findMany({
    where: { userId, chat: { type: "DIRECT" }, isDeleted: false },
    select: { chatId: true },
  });

  const chatIds = myDirectChats.map((c) => c.chatId);

  const partners = await prisma.chatMember.findMany({
    where: { chatId: { in: chatIds }, userId: { not: userId } },
    select: { userId: true },
  });

  const partnerUserIds = partners.map((p) => p.userId);

  // 2. Fetch active status updates
  const activeStatuses = await prisma.status.findMany({
    where: {
      expiresAt: { gt: new Date() },
      OR: [
        { userId },
        { userId: { in: partnerUserIds } },
      ],
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      views: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // 3. Group statuses by user
  const groupedByUser: Record<string, { user: any; statuses: any[] }> = {};

  for (const status of activeStatuses) {
    if (!groupedByUser[status.userId]) {
      groupedByUser[status.userId] = {
        user: status.user,
        statuses: [],
      };
    }
    groupedByUser[status.userId].statuses.push(status);
  }

  // 4. Categorize groups into own, recent, and viewed
  let myStatusGroup = null;
  const recentUpdates: any[] = [];
  const viewedUpdates: any[] = [];

  for (const [groupUserId, group] of Object.entries(groupedByUser)) {
    if (groupUserId === userId) {
      myStatusGroup = group;
    } else {
      // Determine if the current user has viewed ALL statuses in this group
      const allViewed = group.statuses.every((status) =>
        status.views.some((view: any) => view.userId === userId)
      );

      if (allViewed) {
        viewedUpdates.push(group);
      } else {
        recentUpdates.push(group);
      }
    }
  }

  // Sort groups: most recent status's createdAt desc
  const sortByLatest = (a: any, b: any) => {
    const latestA = new Date(a.statuses[a.statuses.length - 1].createdAt).getTime();
    const latestB = new Date(b.statuses[b.statuses.length - 1].createdAt).getTime();
    return latestB - latestA;
  };

  recentUpdates.sort(sortByLatest);
  viewedUpdates.sort(sortByLatest);

  return {
    myStatus: myStatusGroup,
    recent: recentUpdates,
    viewed: viewedUpdates,
  };
}

export async function viewStatus(userId: string, statusId: string) {
  const status = await prisma.status.findUnique({
    where: { id: statusId },
  });

  if (!status) throw new ApiError(404, "Status not found");
  if (status.expiresAt <= new Date()) throw new ApiError(410, "Status has expired");

  // Prevent user from recording view on their own status
  if (status.userId === userId) {
    return { success: true, message: "Own status" };
  }

  await prisma.statusView.upsert({
    where: { statusId_userId: { statusId, userId } },
    create: { statusId, userId },
    update: {},
  });

  return { success: true };
}

export async function getStatusViewers(userId: string, statusId: string) {
  const status = await prisma.status.findUnique({
    where: { id: statusId },
  });

  if (!status) throw new ApiError(404, "Status not found");
  if (status.userId !== userId) {
    throw new ApiError(403, "You can only view status stats of your own updates");
  }

  return prisma.statusView.findMany({
    where: { statusId },
    include: {
      user: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
    },
    orderBy: { viewedAt: "desc" },
  });
}
