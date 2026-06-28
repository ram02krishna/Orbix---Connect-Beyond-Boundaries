import { Router } from "express";
import { z } from "zod";
import * as statusController from "../controllers/status.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createStatusSchema = z.object({
  content: z.string().max(700, "Status must be 700 characters or less").optional(),
  mediaUrl: z.string().url("Invalid media URL").optional(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
  caption: z.string().max(200, "Caption must be 200 characters or less").optional(),
  backgroundColor: z.string().max(100, "Invalid background color").optional(),
});

router.use(authenticate);

router.post("/", validate(createStatusSchema), statusController.createStatus);
router.get("/", statusController.getStatuses);
router.post("/:id/view", statusController.viewStatus);
router.get("/:id/viewers", statusController.getStatusViewers);

export default router;
