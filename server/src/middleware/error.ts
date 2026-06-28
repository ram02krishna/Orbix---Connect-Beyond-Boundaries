import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

// This is the centralized error handler for the whole app.
// It runs whenever you call next(error) or throw inside an async route.
// Express 5 automatically catches async errors, so you rarely need next(error).

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // If it's our custom ApiError, use its status code
  // Otherwise it's an unexpected error — use 500
  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  // Log the error (in production you'd send this to a logging service)
  if (statusCode >= 500) {
    console.error(`[ERROR] ${new Date().toISOString()} — ${err.message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && env.NODE_ENV === "production"
        ? "Something went wrong on our end."
        : err.message,
    // Only show the stack trace in development
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
