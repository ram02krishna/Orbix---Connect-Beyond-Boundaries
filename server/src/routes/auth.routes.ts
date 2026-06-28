import { Router } from "express";
import { z } from "zod";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────
// Zod schemas live here next to the routes so everything is in one place.
// The validate() middleware runs these before the controller.

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number").max(15),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
});

const verifyPhoneSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
});

const resendSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  type: z.enum(["EMAIL", "PHONE"]),
});

const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

const resetPasswordSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Public Routes ────────────────────────────────────────────────────────────
// No auth required for these

router.post("/register",             validate(registerSchema),   authController.register);
router.post("/login",                validate(loginSchema),      authController.login);
router.post("/refresh",                                          authController.refresh);
router.post("/verify-email",         validate(verifyEmailSchema),authController.verifyEmail);
router.post("/verify-phone",         validate(verifyPhoneSchema),authController.verifyPhone);
router.post("/resend-verification",  validate(resendSchema),     authController.resendVerification);
router.post("/forgot-password",      validate(forgotPasswordSchema),authController.forgotPassword);
router.post("/reset-password",       validate(resetPasswordSchema), authController.resetPassword);

// ─── Protected Routes ─────────────────────────────────────────────────────────
// authenticate middleware runs first — if the token is invalid, request stops here

router.post("/logout", authenticate, authController.logout);

export default router;
