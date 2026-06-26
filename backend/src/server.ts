// =============================================================================
// Server Entry Point — Express Application (Security-Hardened)
// =============================================================================

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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

// Helmet: sets secure HTTP headers (X-Content-Type-Options, Strict-Transport-
// Security, X-Frame-Options, X-XSS-Protection, etc.)
app.use(helmet());

// CORS: strict origin policy — only allow the frontend origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: "10kb" }));

// ---------------------------------------------------------------------------
// Rate Limiting — Anti brute-force for auth endpoints
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 20, // max 20 requests per window per IP
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// Apply rate limiter to auth routes
app.use("/api/auth", authLimiter);

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
// Global Error Handler
// ---------------------------------------------------------------------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// ---------------------------------------------------------------------------
// Start Server (only when run directly, not when imported for testing)
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`\n🗳️  Secure Online Election System`);
    console.log(`   Server running on http://localhost:${PORT}`);
    console.log(`   Health check:     http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
