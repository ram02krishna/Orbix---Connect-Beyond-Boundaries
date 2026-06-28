import { prisma } from "../config/prisma.js";
import {
  encryptDeterministic,
  decryptDeterministic,
  encryptMessage,
  decryptMessage
} from "../services/crypto.service.js";

export async function encryptLegacyData() {
  console.log("⚙️ Checking for legacy plain-text data to encrypt...");
  try {
    // 1. Encrypt Users' Email and Phone
    const users = await prisma.user.findMany();
    for (const u of users) {
      let needsUpdate = false;
      const data: any = {};

      const decEmail = decryptDeterministic(u.email);
      if (decEmail === u.email) {
        data.email = encryptDeterministic(u.email);
        needsUpdate = true;
      }

      const decPhone = decryptDeterministic(u.phone);
      if (decPhone === u.phone) {
        data.phone = encryptDeterministic(u.phone);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await prisma.user.update({
          where: { id: u.id },
          data,
        });
        console.log(`🔐 Encrypted credentials for user: ${u.username}`);
      }
    }

    // 2. Encrypt Verification Codes' Target
    const verifications = await prisma.verificationCode.findMany();
    for (const v of verifications) {
      const decTarget = decryptDeterministic(v.target);
      if (decTarget === v.target) {
        await prisma.verificationCode.update({
          where: { id: v.id },
          data: { target: encryptDeterministic(v.target) },
        });
        console.log(`🔐 Encrypted target for verification code: ${v.id}`);
      }
    }

    // 3. Encrypt Messages' Content
    const messages = await prisma.message.findMany({
      where: { content: { not: null } }
    });
    for (const m of messages) {
      if (m.content) {
        const decContent = decryptMessage(m.content);
        if (decContent === m.content) {
          await prisma.message.update({
            where: { id: m.id },
            data: { content: encryptMessage(m.content) },
          });
          console.log(`🔐 Encrypted content for message: ${m.id}`);
        }
      }
    }

    console.log("✅ Database data encryption check completed successfully.");
  } catch (error) {
    console.error("❌ Database data encryption check failed:", error);
  }
}
