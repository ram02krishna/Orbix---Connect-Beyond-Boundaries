import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  if (statusCode >= 500) {
    console.error(`[ERROR] ${new Date().toISOString()} — ${err.message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && env.NODE_ENV === "production"
        ? "Something went wrong on our end."
        : err.message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
