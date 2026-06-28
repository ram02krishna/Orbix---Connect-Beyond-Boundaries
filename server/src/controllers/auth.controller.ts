import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/ApiResponse.js";

// ─── Register ─────────────────────────────────────────────────────────────────
// POST /api/auth/register

export async function register(req: Request, res: Response) {
  const { name, username, email, phone, password } = req.body;

  const user = await authService.register({ name, username, email, phone, password });

  sendSuccess(
    res,
    "Account created! Please check your email for a verification code.",
    { user },
    201
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
// POST /api/auth/login

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body;

  // Read device info from custom headers (the frontend should send these)
  const deviceName = (req.headers["x-device-name"] as string) ?? "Unknown Device";
  const deviceType = (req.headers["x-device-type"] as string) ?? "web";

  const { accessToken, refreshToken, user } = await authService.login({
    identifier,
    password,
    deviceName,
    deviceType,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Store the refresh token in an httpOnly cookie — the browser can't read this
  // with JavaScript, which makes it safe from XSS attacks.
  // In production the client and server live on different domains, so we need
  // sameSite: "none" + secure: true to allow cross-site cookies over HTTPS.
  const isProd = env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,                         // HTTPS only in production
    sameSite: isProd ? "none" : "strict",   // cross-domain in prod, strict locally
    maxAge: 7 * 24 * 60 * 60 * 1000,        // 7 days in milliseconds
  });

  sendSuccess(res, "Logged in successfully", { accessToken, user });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
// POST /api/auth/logout  (requires authenticate middleware)

export async function logout(req: Request, res: Response) {
  // req.user is attached by the authenticate middleware
  await authService.logout(req.user!.sessionId);

  // Clear the refresh token cookie
  res.clearCookie("refreshToken");

  sendSuccess(res, "Logged out successfully");
}

// ─── Refresh Access Token ─────────────────────────────────────────────────────
// POST /api/auth/refresh

export async function refresh(req: Request, res: Response) {
  // The refresh token comes from the httpOnly cookie set at login
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: "No refresh token — please log in" });
    return;
  }

  const { accessToken } = await authService.refreshAccessToken(refreshToken);

  sendSuccess(res, "Access token refreshed", { accessToken });
}

// ─── Verify Email ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-email

export async function verifyEmail(req: Request, res: Response) {
  const { userId, otp } = req.body;

  await authService.verifyEmail(userId, otp);

  sendSuccess(res, "Email verified! You can now log in.");
}

// ─── Verify Phone ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-phone

export async function verifyPhone(req: Request, res: Response) {
  const { userId, otp } = req.body;

  await authService.verifyPhone(userId, otp);

  sendSuccess(res, "Phone number verified! You can now log in.");
}

// ─── Resend Verification Code ─────────────────────────────────────────────────
// POST /api/auth/resend-verification

export async function resendVerification(req: Request, res: Response) {
  const { userId, type } = req.body;

  await authService.resendVerification(userId, type);

  sendSuccess(res, `A new verification code has been sent to your ${type.toLowerCase()}`);
}

// ─── Forgot Password ─────────────────────────────────────────────────────────
// POST /api/auth/forgot-password

export async function forgotPassword(req: Request, res: Response) {
  const { username } = req.body;

  const result = await authService.forgotPassword(username);

  sendSuccess(res, "Verification code sent to your registered email address.", result);
}

// ─── Reset Password ──────────────────────────────────────────────────────────
// POST /api/auth/reset-password

export async function resetPassword(req: Request, res: Response) {
  const { userId, otp, newPassword } = req.body;

  await authService.resetPassword(userId, otp, newPassword);

  sendSuccess(res, "Password reset successfully! You can now log in.");
}

// We need env for the cookie secure flag — import it here
import { env } from "../config/env.js";
