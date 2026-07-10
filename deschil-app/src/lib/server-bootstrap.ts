/**
 * Server bootstrap — runs once at import time on the server bundle only.
 * - Installs core commands so /api/status reports them immediately.
 * - Registers graceful shutdown hooks (Node runtime only).
 */
import { ensureCommandsReady } from "./commands";
import { logger } from "./logger";

const log = logger.child({ mod: "bootstrap" });

ensureCommandsReady();
log.info("server.boot", {
  version: "1.0.0",
  node: typeof process !== "undefined" ? process.version : "n/a",
  env: process?.env?.NODE_ENV ?? "development",
});

if (typeof process !== "undefined" && typeof process.on === "function") {
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info("server.shutdown", { signal });
    // Give in-flight requests a moment; the runtime will exit after handlers settle.
    setTimeout(() => process.exit(0), 250).unref?.();
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
