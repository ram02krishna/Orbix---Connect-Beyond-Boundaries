import crypto from "crypto";
import { env } from "../config/env.js";

// Reusable secret key derived from environment secrets
const KEY = crypto.scryptSync(
  env.JWT_ACCESS_SECRET || "default_secure_key_fallback_32_bytes_long",
  "salt-for-db-encryption",
  32
);

// Deterministic encryption (same input -> same output) using static IV
const ALGORITHM_DET = "aes-256-cbc";
const IV_DET = Buffer.alloc(16, 0); // 16 bytes of zeros

export function encryptDeterministic(text: string | null | undefined): string {
  if (!text) return "";
  const cipher = crypto.createCipheriv(ALGORITHM_DET, KEY, IV_DET);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export function decryptDeterministic(ciphertext: string | null | undefined): string {
  if (!ciphertext) return "";
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM_DET, KEY, IV_DET);
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    // Fallback: return raw ciphertext if decryption fails (e.g. for legacy plain text data)
    return ciphertext;
  }
}

// Non-deterministic encryption (different output each time) using random IV
const ALGORITHM_MSG = "aes-256-cbc";

export function encryptMessage(text: string | null | undefined): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM_MSG, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptMessage(ciphertext: string | null | undefined): string {
  if (!ciphertext) return "";
  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 2) {
      // If there is no colon delimiter, it's not encrypted (legacy plain text message)
      return ciphertext;
    }
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM_MSG, KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return ciphertext;
  }
}

// Generate a cryptographically secure random token (hex string)
// Used for: invite links, password reset tokens, etc.
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

// Generate a random 6-digit numeric OTP
// Used for: email/phone verification
export function generateOTP(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

// Simple sleep helper — useful in tests or retry logic
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
