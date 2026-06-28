import type { Request, Response } from "express";
import * as sessionService from "../services/session.service.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// GET /api/sessions
// Get all active sessions for the current user
export async function getMySessions(req: Request, res: Response) {
  const sessions = await sessionService.getUserSessions(req.user!.id, req.user!.sessionId);
  sendSuccess(res, "Active sessions", { sessions });
}

// DELETE /api/sessions/:sessionId
// Revoke a specific session (kick a device)
export async function revokeSession(req: Request, res: Response) {
  const sessionId = req.params.sessionId as string;
  await sessionService.revokeSession(sessionId, req.user!.id);
  sendSuccess(res, "Session revoked");
}

// DELETE /api/sessions
// Revoke all sessions except the current one ("log out everywhere else")
export async function revokeAllOtherSessions(req: Request, res: Response) {
  const count = await sessionService.revokeAllOtherSessions(
    req.user!.id,
    req.user!.sessionId
  );
  sendSuccess(res, `Logged out of ${count} other device(s)`);
}

