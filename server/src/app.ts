import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

import { env } from "./config/env.js";

// ─── Import Routes ───────────────────────────────────────────────────────────
import authRoutes    from "./routes/auth.routes.js";
import userRoutes    from "./routes/user.routes.js";
import chatRoutes    from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import mediaRoutes   from "./routes/media.routes.js";
import statusRoutes  from "./routes/status.routes.js";
import { errorHandler } from "./middleware/error.js";

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();

// Trust reverse proxy (needed for rate limiting + IP detection behind Nginx/etc.)
app.set("trust proxy", 1);

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "frame-ancestors": ["'self'", env.CLIENT_URL || "http://localhost:3000"],
      },
    },
    frameguard: false,
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-device-name", "x-device-type"],
  })
);

// ─── Logging ─────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
}

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(env.COOKIE_SECRET));

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: Number(env.RATE_LIMIT_WINDOW_MS),  // default: 15 min
  limit: Number(env.RATE_LIMIT_MAX_REQUESTS),   // default: 100 req / window
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests — please try again later.",
  },
});

app.use("/api", globalLimiter);

// ─── Stricter Rate Limiter for Auth Routes ────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  limit: 5000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts — please try again in 30 seconds.",
  },
});

app.use("/api/auth", authLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/chats",    chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/media",    mediaRoutes);
app.use("/api/status",   statusRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Express 5 automatically forwards async errors — no need for try/catch in routes
app.use(errorHandler);

export default app;
