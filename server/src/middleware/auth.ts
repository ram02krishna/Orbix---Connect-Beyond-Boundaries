import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

// ─── Extend the Express Request type ─────────────────────────────────────────
// This lets us do req.user.id in any route handler after this middleware runs.
// The sessionId is needed so we can invalidate the exact session on logout.

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        sessionId: string;
      };
    }
  }
}

// ─── Authenticate Middleware ──────────────────────────────────────────────────
// Attach this to any route that requires a logged-in user.
// Usage: router.get("/me", authenticate, userController.getMe)

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  // Check Authorization header or query parameter 'token'
  let token = "";
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token && typeof req.query.token === "string") {
    token = req.query.token;
  }

  if (!token) {
    throw new ApiError(401, "You must be logged in to do this");
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      email: string;
      sessionId: string;
    };

    // Attach user info to the request object
    req.user = {
      id: payload.id,
      email: payload.email,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // The frontend should use the /refresh endpoint to get a new access token
      throw new ApiError(401, "Session expired — please log in again");
    }
    throw new ApiError(401, "Invalid token");
  }
}
