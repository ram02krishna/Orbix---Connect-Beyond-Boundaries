import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError.js";

// ─── Validate Middleware ──────────────────────────────────────────────────────
// Validates req.body against a Zod schema before the controller runs.
// If validation fails, it throws an ApiError with the first validation error.
// If it passes, req.body is replaced with the clean, typed data.
//
// Usage:
//   router.post("/register", validate(registerSchema), authController.register)

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Get the first validation error and make it human-readable
      const firstIssue = result.error.issues[0];
      const field = firstIssue.path.join(".");
      const message = field
        ? `${field}: ${firstIssue.message}`
        : firstIssue.message;

      throw new ApiError(400, message);
    }

    // Replace req.body with the validated + sanitized data
    // This removes any extra fields the client might have sent
    req.body = result.data;
    next();
  };
}
