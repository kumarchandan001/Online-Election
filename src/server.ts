// =============================================================================
// Server Entry Point — Express Application
// =============================================================================

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import electionRoutes from "./routes/election.routes";

// ---------------------------------------------------------------------------
// Initialize Express
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

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
// Start Server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🗳️  Secure Online Election System`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Health check:     http://localhost:${PORT}/api/health\n`);
});

export default app;
