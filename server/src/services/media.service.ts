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

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  folder = "chat-app/attachments"
): Promise<{
  url: string;
  publicId: string;
  thumbUrl?: string;
  fileType: string;
}> {
  const resourceType = ALLOWED_TYPES[mimeType];

  if (!resourceType) {
    throw new ApiError(400, `File type "${mimeType}" is not allowed`);
  }

  if (buffer.length > MAX_SIZES[resourceType]) {
    const maxMB = MAX_SIZES[resourceType] / 1024 / 1024;
    throw new ApiError(400, `File is too large. Maximum size is ${maxMB}MB`);
  }

  // Upload by wrapping the stream in a Promise
  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    eager?: Array<{ secure_url: string }>;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // Auto-generate thumbnails for images and videos
        ...(resourceType === "image" && {
          eager: [{ width: 300, height: 300, crop: "fill", quality: "auto" }],
        }),
        ...(resourceType === "video" && {
          eager: [{ width: 320, height: 240, crop: "fill", format: "jpg" }],
        }),
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result);
      }
    );

    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    thumbUrl: result.eager?.[0]?.secure_url,
    fileType: resourceType,
  };
}

// ─── Delete a file from Cloudinary ───────────────────────────────────────────

export async function deleteFile(publicId: string, resourceType: "image" | "video" | "raw" = "image") {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
