import { cloudinary } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

// Allowed MIME types and their Cloudinary resource types
const ALLOWED_TYPES: Record<string, "image" | "video" | "raw"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "audio/mpeg": "raw",
  "audio/ogg": "raw",
  "audio/wav": "raw",
  "audio/webm": "raw",
  "audio/mp4": "raw",
  "audio/x-m4a": "raw",
  "audio/aac": "raw",
  "application/pdf": "raw",
};

// Max sizes per type (in bytes)
const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,  // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
  raw: 50 * 1024 * 1024,    // 50 MB
};

// ─── Upload a file buffer to Cloudinary ───────────────────────────────────────
// We use multer.memoryStorage() so the file comes in as a Buffer.
// We then stream it to Cloudinary manually instead of saving it to disk.

export function generateUploadSignature(folder: string = "chat-app/attachments") {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    cloudinary.config().api_secret!
  );

  return {
    signature,
    timestamp,
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
    folder,
  };
}

// ─── Delete a file from Cloudinary ───────────────────────────────────────────

export async function deleteFile(publicId: string, resourceType: "image" | "video" | "raw" = "image") {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
