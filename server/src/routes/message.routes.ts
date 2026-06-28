import { Router } from "express";
import { z } from "zod";
import * as messageController from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// Zod schemas for message payloads
const sendMessageSchema = z.object({
  content: z.string().optional().nullable(),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "FILE", "EMOJI", "SYSTEM"]).default("TEXT"),
  replyToId: z.string().uuid("Invalid reply message ID").optional().nullable(),
  attachments: z.array(
    z.object({
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
      fileUrl: z.string(),
      mimeType: z.string(),
      thumbUrl: z.string().optional().nullable(),
    })
  ).optional(),
});

const editMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
});

const reactionSchema = z.object({
  emoji: z.string().min(1, "Emoji cannot be empty"),
});

// All message routes require authentication
router.use(authenticate);

// Chat specific endpoints
router.post("/:chatId", validate(sendMessageSchema), messageController.sendMessage);
router.get("/:chatId", messageController.getMessages);

// Individual message actions
router.patch("/:messageId", validate(editMessageSchema), messageController.editMessage);
router.delete("/:messageId", messageController.deleteMessage);
router.post("/:messageId/react", validate(reactionSchema), messageController.toggleReaction);
router.post("/:messageId/read", messageController.markAsRead);

export default router;
