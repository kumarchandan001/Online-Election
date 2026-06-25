// =============================================================================
// Prisma 7 Configuration — prisma.config.ts
// =============================================================================
// This file replaces the old `url` in schema.prisma.
// It configures the datasource URL for Prisma Migrate and CLI commands.
// =============================================================================

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrate: {
    async schema() {
      return "prisma/schema.prisma";
    },
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
