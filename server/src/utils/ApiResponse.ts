import type { Response } from "express";

// Every response from our API has the same shape:
// { success: true/false, message: "...", data: { ... } }
//
// This makes it easier for the frontend to handle responses consistently.

export const sendSuccess = (
  res: Response,
  message: string,
  data: Record<string, unknown> = {},
  statusCode = 200
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
