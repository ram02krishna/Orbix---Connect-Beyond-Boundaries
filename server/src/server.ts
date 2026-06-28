import { createServer } from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { initializeSockets } from "./sockets/index.js";
import { encryptLegacyData } from "./utils/encrypt_legacy.js";

const PORT = Number(env.PORT) || 5000;

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const httpServer = createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
  // Automatically re-sends missed events when a client reconnects within 2 min
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

initializeSockets(io);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function startServer(): Promise<void> {
  try {
    // Verify DB is reachable before accepting traffic
    await prisma.$connect();
    console.log("✅ Database connected");

    // Run legacy database encryption migration
    await encryptLegacyData();

    httpServer.listen(PORT, () => {
      console.log(`
┌────────────────────────────────────────┐
│   🚀  Orbix Server                  │
├────────────────────────────────────────┤
│  Port    : ${String(PORT).padEnd(29)}│
│  Env     : ${env.NODE_ENV.padEnd(29)}│
│  Client  : ${env.CLIENT_URL.padEnd(29)}│
│  Health  : http://localhost:${PORT}/health ${" ".repeat(Math.max(0, 8 - String(PORT).length))}│
└────────────────────────────────────────┘
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  console.log(`\n⚡ ${signal} received — shutting down gracefully...`);

  // Force-exit if graceful shutdown exceeds 10 seconds
  const forceExit = setTimeout(() => {
    console.error("⚠️  Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10_000);

  httpServer.close(async () => {
    console.log("🔌 HTTP server closed");

    io.close();
    console.log("🔌 Socket.IO closed");

    await prisma.$disconnect();
    console.log("🔌 Database disconnected");

    clearTimeout(forceExit);
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT",  () => void shutdown("SIGINT"));

// ─── Safety Nets ──────────────────────────────────────────────────────────────
process.on("uncaughtException", (err: Error) => {
  console.error("💥 Uncaught Exception:", err.message, err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(1);
});

// ─── Start ────────────────────────────────────────────────────────────────────
void startServer();
