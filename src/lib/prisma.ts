// =============================================================================
// Prisma Client — Singleton Instance (Prisma 7 / Driver Adapter)
// =============================================================================
// TypeScript version. Uses @prisma/adapter-pg driver adapter as required by
// Prisma 7. Prevents connection pool exhaustion during development.
// =============================================================================

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Extend globalThis to persist the client across hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "info", "warn", "error"],
  });
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient();
  }
  prisma = globalThis.__prisma;
}

export { prisma };
