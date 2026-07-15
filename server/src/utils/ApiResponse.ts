import type { Response } from "express";

// all successful API responses follow this shape:
// { success: true, message: "...", data: { ... } }
export const sendSuccess = (
  res: Response,
  message: string,
  data: Record<string, unknown> = {},
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
