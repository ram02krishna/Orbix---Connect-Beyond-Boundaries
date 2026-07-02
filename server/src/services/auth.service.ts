import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import { sendMail } from "../config/mail.js";
import { ApiError } from "../utils/ApiError.js";
import { encryptDeterministic, decryptDeterministic } from "./crypto.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterInput {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

interface LoginInput {
  identifier: string;
  password: string;
  deviceName: string;
  deviceType: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Token Helpers ────────────────────────────────────────────────────────────
// Keep these private to this file — only the service should create tokens

function createAccessToken(userId: string, email: string, sessionId: string) {
  return jwt.sign(
    { id: userId, email, sessionId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
  );
}

function createRefreshToken(userId: string, sessionId: string) {
  return jwt.sign(
    { id: userId, sessionId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
  );
}

// ─── OTP Helper ───────────────────────────────────────────────────────────────

function generateOTP(): string {
  // Simple 6-digit code — good enough for email/phone verification
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(input: RegisterInput) {
  const { name, username, email, phone, password } = input;

  const encryptedPhone = encryptDeterministic(phone);
  const encryptedEmail = encryptDeterministic(email);

  // Make sure the phone number isn't already taken (phone is unique, email is not)
  const phoneTaken = await prisma.user.findUnique({ where: { phone: encryptedPhone } });
  if (phoneTaken) throw new ApiError(409, "An account with this phone number already exists");

  // Make sure the username isn't already taken
  const usernameTaken = await prisma.user.findUnique({ where: { username } });
  if (usernameTaken) throw new ApiError(409, "This username is already taken");

  // Hash the password — argon2 is much stronger than bcrypt
  const passwordHash = await argon2.hash(password);

  // Create the user in the database
  const user = await prisma.user.create({
    data: { name, username, email: encryptedEmail, phone: encryptedPhone, passwordHash },
    select: { id: true, name: true, email: true, phone: true, username: true },
  });

  // Send only email verification OTP — phone verification is skipped
  await sendEmailOTP(user.id, email, name);

  return {
    ...user,
    email: decryptDeterministic(user.email),
    phone: decryptDeterministic(user.phone),
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(input: LoginInput) {
  const { identifier, password, deviceName, deviceType, ipAddress, userAgent } = input;

  // Find the user by username OR phone (encrypt search query for phone lookups)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { phone: encryptDeterministic(identifier) }
      ]
    }
  });

  // Always say "invalid credentials" to prevent enumeration attacks
  if (!user) throw new ApiError(401, "Invalid credentials");

  const passwordOk = await argon2.verify(user.passwordHash, password);
  if (!passwordOk) throw new ApiError(401, "Invalid credentials");

  // Block unverified users from logging in (email only — phone verification is not required)
  if (!user.emailVerified) {
    throw new ApiError(403, "Please verify your email address to log in");
  }

  // Pre-generate the sessionId so we can include it in both tokens
  const sessionId = uuidv4();
  const refreshToken = createRefreshToken(user.id, sessionId);
  const refreshTokenHash = await argon2.hash(refreshToken);

  // Sessions expire in 365 days (matches JWT_REFRESH_EXPIRES_IN)
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // Enforce session limit: if there are 3 or more active sessions, revoke the oldest ones to make space
  const activeSessions = await prisma.session.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "asc" }, // oldest first
  });

  if (activeSessions.length >= 3) {
    const numToRevoke = activeSessions.length - 2; // Keep at most 2 active sessions so the new one makes it 3
    const sessionsToRevoke = activeSessions.slice(0, numToRevoke);
    
    await prisma.session.updateMany({
      where: { id: { in: sessionsToRevoke.map((s) => s.id) } },
      data: { isActive: false },
    });
  }

  // Save the session to the database
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      deviceName,
      deviceType,
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  const accessToken = createAccessToken(user.id, decryptDeterministic(user.email), sessionId);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: decryptDeterministic(user.email),
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    },
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(sessionId: string) {
  // Mark the session as inactive so the refresh token can't be reused
  await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
}

// ─── Refresh Access Token ─────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string) {
  // Decode and verify the refresh token
  let payload: { id: string; sessionId: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as typeof payload;
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token — please log in again");
  }

  // Look up the session in the DB
  const session = await prisma.session.findFirst({
    where: {
      id: payload.sessionId,
      userId: payload.id,
      isActive: true,
    },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new ApiError(401, "Session expired — please log in again");
  }

  // Double-check: make sure the provided refresh token matches what we stored
  const tokenMatches = await argon2.verify(session.refreshTokenHash, refreshToken);
  if (!tokenMatches) throw new ApiError(401, "Invalid refresh token");

  // Update lastSeenAt so we can show "last active X minutes ago"
  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  const accessToken = createAccessToken(session.user.id, decryptDeterministic(session.user.email), session.id);
  return { accessToken };
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export async function verifyEmail(userId: string, otp: string) {
  // Find the most recent unused EMAIL code for this user that hasn't expired
  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      type: "EMAIL",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new ApiError(400, "No valid email verification code found — please request a new one");
  }

  const codeOk = await argon2.verify(record.codeHash, otp);
  if (!codeOk) throw new ApiError(400, "Incorrect verification code");

  // Mark the code as used and verify the user's email in one atomic transaction
  await prisma.$transaction([
    prisma.verificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    }),
  ]);
}

export async function verifyPhone(userId: string, otp: string) {
  // Find the most recent unused PHONE code for this user that hasn't expired
  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      type: "PHONE",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new ApiError(400, "No valid phone verification code found — please request a new one");
  }

  const codeOk = await argon2.verify(record.codeHash, otp);
  if (!codeOk) throw new ApiError(400, "Incorrect verification code");

  // Mark the code as used and verify the user's phone in one atomic transaction
  await prisma.$transaction([
    prisma.verificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true },
    }),
  ]);
}

// ─── Resend Verification Code ─────────────────────────────────────────────────

export async function resendVerification(userId: string, type: "EMAIL" | "PHONE") {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  if (type === "EMAIL" && user.emailVerified) {
    throw new ApiError(400, "Your email is already verified");
  }
  if (type === "PHONE" && user.phoneVerified) {
    throw new ApiError(400, "Your phone number is already verified");
  }

  // Rate-limit resends using Redis — users can only resend once every 60 seconds
  const rateLimitKey = `resend_otp:${type}:${userId}`;
  const recentlySent = await redis.get(rateLimitKey);
  if (recentlySent) {
    throw new ApiError(429, "Please wait 60 seconds before requesting another code");
  }

  if (type === "EMAIL") {
    await sendEmailOTP(userId, decryptDeterministic(user.email), user.name);
  } else {
    await sendPhoneOTP(userId, decryptDeterministic(user.phone!), user.name);
  }

  // Block another resend for 60 seconds
  await redis.set(rateLimitKey, "1", { ex: 60 });
}

// ─── Internal Helper: Send Email OTP ─────────────────────────────────────────

async function sendEmailOTP(userId: string, email: string, name: string) {
  const otp = generateOTP();
  const otpHash = await argon2.hash(otp);

  await prisma.verificationCode.create({
    data: {
      userId,
      type: "EMAIL",
      target: encryptDeterministic(email),
      codeHash: otpHash,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
    },
  });

  await sendMail({
    to: email,
    subject: "Verify your email — Orbix",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Hey ${name}, welcome to Orbix! 👋</h2>
        <p>Use this code to verify your email address:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                    background: #f4f4f4; padding: 20px; text-align: center;
                    border-radius: 8px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #888;">This code expires in 10 minutes. If you didn't sign up, ignore this email.</p>
      </div>
    `,
  });

  // Beautiful Console Log box so student can get OTPs for free in development
  console.log(`
┌────────────────────────────────────────────────────────┐
│ 📧 EMAIL OTP SENT SUCCESSFULLY!                        │
│                                                        │
│ User:  ${name.padEnd(46)} │
│ Email: ${email.padEnd(46)} │
│ OTP:   ${otp.padEnd(46)} │
│                                                        │
│ (Copy this OTP code to verify your email address)       │
└────────────────────────────────────────────────────────┘
  `);
}

// ─── Internal Helper: Send Phone OTP ─────────────────────────────────────────

async function sendPhoneOTP(userId: string, phone: string, name: string) {
  const otp = generateOTP();
  const otpHash = await argon2.hash(otp);

  await prisma.verificationCode.create({
    data: {
      userId,
      type: "PHONE",
      target: encryptDeterministic(phone),
      codeHash: otpHash,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
    },
  });

  // Beautiful Console Log box so student can get OTPs for free in development
  console.log(`
┌────────────────────────────────────────────────────────┐
│ 📱 SMS OTP SENT SUCCESSFULLY!                          │
│                                                        │
│ User:  ${name.padEnd(46)} │
│ Phone: ${phone.padEnd(46)} │
│ OTP:   ${otp.padEnd(46)} │
│                                                        │
│ (Copy this OTP code to verify your phone number)        │
└────────────────────────────────────────────────────────┘
  `);

  // Optional Twilio SMS Integration
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      // Dynamically import twilio to avoid crash if package not installed
      const twilioModule: any = await import("twilio" as any);
      const client = twilioModule.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await client.messages.create({
        body: `Dear ${name}, your Orbix OTP code is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    } catch (err) {
      console.error("Twilio SMS send failure:", err);
    }
  }
}

// ─── Forgot Password ─────────────────────────────────────────────────────────

export async function forgotPassword(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new ApiError(404, "No account found with this username");
  }

  const otp = generateOTP();
  const otpHash = await argon2.hash(otp);

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      type: "EMAIL",
      target: user.email, // already encrypted
      codeHash: otpHash,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
    },
  });

  const decryptedEmail = decryptDeterministic(user.email);

  await sendMail({
    to: decryptedEmail,
    subject: "Reset your password — Orbix",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Password Reset Request 👋</h2>
        <p>Use this code to reset your password:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                    background: #f4f4f4; padding: 20px; text-align: center;
                    border-radius: 8px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #888;">This code expires in 10 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  });

  // Beautiful Console Log box so student can get OTPs for free in development
  console.log(`
┌────────────────────────────────────────────────────────┐
│ 🔑 PASSWORD RESET OTP SENT SUCCESSFULLY!               │
│                                                        │
│ User:  ${user.name.padEnd(46)} │
│ Email: ${decryptedEmail.padEnd(46)} │
│ OTP:   ${otp.padEnd(46)} │
│                                                        │
│ (Copy this OTP code to reset your password)             │
└────────────────────────────────────────────────────────┘
  `);

  // Mask the email so we don't expose it completely
  const [local, domain] = decryptedEmail.split("@");
  const maskedEmail = `${local[0]}***${local[local.length - 1] || ""}@${domain}`;

  return {
    userId: user.id,
    email: maskedEmail,
  };
}

// ─── Reset Password ──────────────────────────────────────────────────────────

export async function resetPassword(userId: string, otp: string, newPassword: string) {
  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      type: "EMAIL",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new ApiError(400, "No valid verification code found or code expired — please try again");
  }

  const codeOk = await argon2.verify(record.codeHash, otp);
  if (!codeOk) {
    throw new ApiError(400, "Incorrect verification code");
  }

  // Hash new password and mark OTP code as used
  const passwordHash = await argon2.hash(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.verificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

