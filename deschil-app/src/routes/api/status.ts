import { createFileRoute } from "@tanstack/react-router";
import { aiRouterStatus } from "@/lib/ai/router";
import { ensureCommandsReady, listCommands } from "@/lib/commands";
import { APP_VERSION } from "@/lib/commands/core";

export const Route = createFileRoute("/api/status")({
  server: {
    handlers: {
      GET: async () => {
        ensureCommandsReady();
        return Response.json({
          name: "DESCHIL SERVER",
          version: APP_VERSION,
          uptime: Math.floor(process.uptime()),
          node: process.version,
          env: process.env.NODE_ENV ?? "development",
          providers: aiRouterStatus(),
          platforms: {
            telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
            whatsapp: Boolean(process.env.WHATSAPP_TOKEN || process.env.GREEN_API_TOKEN),
            discord: Boolean(process.env.DISCORD_BOT_TOKEN),
          },
          commands: listCommands().map((c) => ({
            name: c.name,
            aliases: c.aliases ?? [],
            permission: c.permission ?? "public",
            description: c.description,
          })),
        });
      },
    },
  },
});
