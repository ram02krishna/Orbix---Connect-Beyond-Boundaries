import { Router } from "express";
import * as mediaController from "../controllers/media.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All media routes require a logged-in user
router.use(authenticate);

// GET route to get a Cloudinary upload signature
router.get("/signature", mediaController.getSignature);

// PATCH route to update user profile avatar URL after direct upload
router.patch("/avatar", mediaController.updateAvatarUrl);

// GET route to proxy and download shared media files with original filenames and extensions
router.get("/download", mediaController.downloadFile);

export default router;
