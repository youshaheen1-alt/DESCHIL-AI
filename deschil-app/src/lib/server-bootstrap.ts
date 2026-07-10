/**
 * Server bootstrap — runs once at import time on the server bundle only.
 * - Validates required environment variables and logs warnings for missing ones.
 * - Bootstraps the database schema (CREATE TABLE IF NOT EXISTS — safe to run
 *   on every cold start).
 * - Installs core commands so /api/status reports them immediately.
 * - Registers graceful shutdown hooks (Node runtime only).
 */
import { bootstrapDatabase } from "./db/bootstrap";
import { closePool } from "./db/client";
import { ensureCommandsReady } from "./commands";
import { logger } from "./logger";

const log = logger.child({ mod: "bootstrap" });

// ── Environment variable validation ──────────────────────────────────────────
const REQUIRED_VARS = ["DATABASE_URL", "SESSION_SECRET"] as const;
const OPTIONAL_VARS = [
  "PGSSL",
  "DESCHIL_USER",
  "DESCHIL_PASSWORD",
  "GROQ_API_KEY",
  "DEFAULT_AI_PROVIDER",
  "DEFAULT_AI_MODEL",
  "LOG_LEVEL",
] as const;

for (const v of REQUIRED_VARS) {
  if (!process.env[v]) {
    log.warn("env.missing_required", { var: v, hint: `Set ${v} in Railway dashboard` });
  }
}
for (const v of OPTIONAL_VARS) {
  if (!process.env[v]) {
    log.debug("env.missing_optional", { var: v });
  }
}

// ── Command registry ────────────────────────────────────────────────────────
ensureCommandsReady();

log.info("server.boot", {
  version: "1.0.0",
  node: typeof process !== "undefined" ? process.version : "n/a",
  env: process?.env?.NODE_ENV ?? "development",
  dbConfigured: Boolean(process.env.DATABASE_URL),
  adminConfigured: Boolean(process.env.DESCHIL_USER && process.env.DESCHIL_PASSWORD),
});

// ── Database schema bootstrap ─────────────────────────────────────────────────
// Run as a background best-effort — don't block the HTTP server from starting.
// If DATABASE_URL is missing the bootstrap silently skips inside bootstrapDatabase().
bootstrapDatabase().catch((err) => {
  log.warn("db.bootstrap_failed_at_startup", {
    error: err instanceof Error ? err.message : String(err),
    hint: "Check DATABASE_URL and PGSSL settings. The app will retry on first request.",
  });
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
if (typeof process !== "undefined" && typeof process.on === "function") {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info("server.shutdown", { signal });
    try {
      await closePool();
    } catch {
      // ignore pool errors on shutdown
    }
    setTimeout(() => process.exit(0), 500).unref?.();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("uncaughtException", (err) => {
    log.error("server.uncaught", { error: err instanceof Error ? err.message : String(err) });
  });
  process.on("unhandledRejection", (err) => {
    log.error("server.unhandled_rejection", { error: err instanceof Error ? err.message : String(err) });
  });
}
