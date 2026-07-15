import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError.js";

// validates req.body against a Zod schema
// replaces req.body with the clean, typed data if valid
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const field = firstIssue.path.join(".");
      const message = field
        ? `${field}: ${firstIssue.message}`
        : firstIssue.message;

      throw new ApiError(400, message);
    }

    req.body = result.data;
    next();
  };
}
