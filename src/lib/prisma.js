// =============================================================================
// Prisma Client — Singleton Instance (Prisma 7 / Driver Adapter)
// =============================================================================
// Provides a single, reusable PrismaClient instance across the application.
// Uses the @prisma/adapter-pg driver adapter as required by Prisma 7.
// Prevents connection pool exhaustion during development with hot-reloading.
// =============================================================================

require("dotenv/config");

const { PrismaClient } = require("../generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

/**
 * Creates a new PrismaClient instance with the pg driver adapter.
 * @returns {import("../generated/prisma/client").PrismaClient}
 */
function createPrismaClient() {
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

/** @type {import("../generated/prisma/client").PrismaClient} */
let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  // In development, reuse the client across hot-reloads
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient();
  }
  prisma = globalThis.__prisma;
}

module.exports = { prisma };
