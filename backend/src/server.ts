// =============================================================================
// Server Entry Point — Express Application (Security-Hardened)
// =============================================================================

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import authRoutes from "./routes/auth.routes";
import electionRoutes from "./routes/election.routes";

// ---------------------------------------------------------------------------
// Initialize Express
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------------------------

// Disable "X-Powered-By: Express" header to hide technology stack
app.disable("x-powered-by");

// Helmet: sets secure HTTP headers (X-Content-Type-Options, Strict-Transport-
// Security, X-Frame-Options, X-XSS-Protection, CSP, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    // Enforce HTTPS in production
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Prevent clickjacking
    frameguard: { action: "deny" },
    // Prevent MIME type sniffing
    noSniff: true,
    // Hide referrer on cross-origin navigation
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// Always allow these origins (production + local dev)
const HARDCODED_ORIGINS = [
  "https://online-election-theta.vercel.app",
  "http://localhost:3001",
  "http://localhost:3000",
];

const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOrigins = [...new Set([...HARDCODED_ORIGINS, ...envOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        console.log("[CORS] Request with no origin allowed.");
        return callback(null, true);
      }
      
      const cleanOrigin = origin.trim().replace(/\/$/, "");
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed.toLowerCase() === cleanOrigin.toLowerCase()
      );

      console.log(`[CORS] Incoming origin: "${origin}" | Cleaned: "${cleanOrigin}" | Allowed: ${JSON.stringify(allowedOrigins)} | Match: ${isAllowed}`);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body parser — limit payload size to prevent large payload DoS
app.use(express.json({ limit: "10kb" }));

// Attach unique request ID for tracing
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.headers["x-request-id"] =
    req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

// Global limiter — applies to ALL API routes
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // max 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down and try again.",
  },
});
app.use("/api", globalLimiter);

// Auth limiter — stricter for login/register (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 10, // max 10 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
});
app.use("/api/auth", authLimiter);

// Vote limiter — prevent vote spam (even though DB prevents double votes)
const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1-minute window
  max: 10, // max 10 vote attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many vote attempts. Please wait a moment and try again.",
  },
});
app.use("/api/elections/:id/vote", voteLimiter);

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "Secure Online Election System",
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/elections", electionRoutes);

// ---------------------------------------------------------------------------
// 404 Handler
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found." });
});

// ---------------------------------------------------------------------------
// Global Error Handler — never leak stack traces to client
// ---------------------------------------------------------------------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Log internally for debugging
  if (process.env.NODE_ENV !== "production") {
    console.error("Unhandled error:", err);
  } else {
    console.error("Unhandled error:", err.message);
  }

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    res.status(403).json({ error: "Origin not allowed." });
    return;
  }

  // Never send stack traces or error details to the client
  res.status(500).json({ error: "Internal server error." });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`\n🗳️  Secure Online Election System`);
    console.log(`   Server running on http://localhost:${PORT}`);
    console.log(`   Health check:     http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
