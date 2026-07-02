import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import * as mediaService from "../services/media.service.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// GET /api/media/signature
// Generate a Cloudinary upload signature for direct uploads
export async function getSignature(req: Request, res: Response) {
  const folder = req.query.folder as string;

  if (!folder) {
    throw new ApiError(400, "Folder is required");
  }

  // Basic validation to restrict where users can upload
  if (!folder.startsWith("chat-app/")) {
    throw new ApiError(400, "Invalid folder path");
  }

  // If uploading to a specific chat, verify membership
  const isAvatar = folder === "chat-app/avatars";
  const isGeneral = folder === "chat-app/general";
  
  if (!isAvatar && !isGeneral) {
    const chatId = folder.split("chat-app/")[1];
    if (chatId) {
      const membership = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId: req.user!.id } },
      });
      if (!membership) throw new ApiError(403, "You are not in this chat");
    }
  }

  const signatureData = mediaService.generateUploadSignature(folder);
  sendSuccess(res, "Signature generated", signatureData);
}

// PATCH /api/media/avatar
// Update the user's avatarUrl in the database after direct upload
export async function updateAvatarUrl(req: Request, res: Response) {
  const { avatarUrl } = req.body;
  if (!avatarUrl) throw new ApiError(400, "avatarUrl is required");

  // Update the user's avatarUrl in the database
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatarUrl },
  });

  sendSuccess(res, "Avatar updated", { avatarUrl });
}

// GET /api/media/download
// Proxy file downloads from Cloudinary to enforce original filename and extension download
export async function downloadFile(req: Request, res: Response) {
  const url = req.query.url as string;
  const filename = req.query.name as string;
  const inline = req.query.inline === "true";

  if (!url) {
    throw new ApiError(400, "URL query parameter is required");
  }
  if (!filename) {
    throw new ApiError(400, "Filename query parameter is required");
  }

  try {
    // Fetch the file from Cloudinary using native fetch
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(response.status, `Failed to fetch file from storage: ${response.statusText}`);
    }

    // Set headers to trigger file download or inline view with original filename
    if (inline) {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      // Remove frame restrictions set by Helmet so the client on port 3000 can embed this stream
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");
      res.removeHeader("x-frame-options");
      res.removeHeader("content-security-policy");
    } else {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (response.body) {
      const { Readable } = await import("stream");
      const nodeReadable = Readable.fromWeb(response.body as any);
      nodeReadable.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("Download proxy error:", err);
    throw new ApiError(500, "Failed to download file from storage proxy");
  }
}
