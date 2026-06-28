import { Router } from "express";
import * as sessionController from "../controllers/session.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All session routes require a logged-in user
router.use(authenticate);

router.get("/", sessionController.getMySessions);
router.delete("/:sessionId", sessionController.revokeSession);
router.delete("/", sessionController.revokeAllOtherSessions);

export default router;
