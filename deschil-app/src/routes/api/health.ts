import { createFileRoute } from "@tanstack/react-router";
import { query } from "@/lib/db/client";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const checks: Record<string, string> = { server: "ok" };
        if (process.env.DATABASE_URL) {
          try {
            await query("SELECT 1");
            checks.database = "ok";
          } catch (err) {
            checks.database = err instanceof Error ? err.message : "error";
          }
        } else {
          checks.database = "not-configured";
        }
        const healthy = Object.values(checks).every((v) => v === "ok" || v === "not-configured");
        return Response.json(
          { status: healthy ? "healthy" : "degraded", checks, ts: new Date().toISOString() },
          { status: healthy ? 200 : 503 },
        );
      },
    },
  },
});
