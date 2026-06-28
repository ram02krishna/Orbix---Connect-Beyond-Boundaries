import { Router } from "express";
import multer from "multer";
import * as mediaController from "../controllers/media.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Configure multer to store files in memory before uploading to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB file size limit
  },
});

// All media routes require a logged-in user
router.use(authenticate);

// Multipart/form-data upload route for general chat files (images, video, etc.)
router.post("/upload", upload.single("file"), mediaController.uploadFile);

// Multipart/form-data upload route for user profile avatar
router.post("/avatar", upload.single("file"), mediaController.uploadAvatar);

// GET route to proxy and download shared media files with original filenames and extensions
router.get("/download", mediaController.downloadFile);

export default router;
