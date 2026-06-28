import nodemailer from "nodemailer";
import { env } from "./env.js";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465, // true for port 465, false for 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Send an email.
 * @example
 *   await sendMail({
 *     to: "user@example.com",
 *     subject: "Verify your email",
 *     html: "<p>Your OTP is <b>123456</b></p>",
 *   });
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  return transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    text,
  });
}
