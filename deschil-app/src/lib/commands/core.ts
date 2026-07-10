/**
 * Core commands — registered on server boot. Same implementations run on every
 * platform (web, telegram, whatsapp, discord, api).
 */
import { aiRouterStatus, routeChat } from "../ai/router";
import { query } from "../db/client";
import { registerCommand, listCommands } from "./bus";

export const APP_VERSION = "1.0.0";

let installed = false;

export function installCoreCommands(): void {
  if (installed) return;
  installed = true;

  registerCommand({
    name: "help",
    aliases: ["h", "?"],
    description: "Show all available commands.",
    handler: () => {
      const rows = listCommands()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => {
          const aliases = c.aliases?.length ? ` (${c.aliases.join(", ")})` : "";
          return `• ${c.name}${aliases} — ${c.description}`;
        });
      return { text: ["Commands:", ...rows].join("\n") };
    },
  });

  registerCommand({
    name: "ping",
    description: "Health check — responds with pong.",
    handler: () => ({ text: "pong" }),
  });

  registerCommand({
    name: "version",
    aliases: ["v"],
    description: "Show DESCHIL SERVER version.",
    handler: () => ({ text: `DESCHIL SERVER v${APP_VERSION}` }),
  });

  registerCommand({
    name: "status",
    description: "Show runtime status.",
    handler: async () => {
      const providers = aiRouterStatus().filter((p) => p.enabled).map((p) => p.id).join(", ") || "none";
      const uptime = Math.floor(process.uptime());
      const platforms = [
        process.env.TELEGRAM_BOT_TOKEN ? "telegram" : null,
        process.env.WHATSAPP_TOKEN ? "whatsapp" : null,
        process.env.DISCORD_BOT_TOKEN ? "discord" : null,
      ]
        .filter(Boolean)
        .join(", ") || "web only";
      return {
        text: [
          `Version: ${APP_VERSION}`,
          `Uptime: ${uptime}s`,
          `Node: ${process.version}`,
          `Providers: ${providers}`,
          `Platforms: ${platforms}`,
          `Env: ${process.env.NODE_ENV ?? "development"}`,
        ].join("\n"),
      };
    },
  });

  registerCommand({
    name: "health",
    description: "Ping database and report health.",
    handler: async () => {
      const parts: string[] = [];
      parts.push("server: ok");
      if (process.env.DATABASE_URL) {
        try {
          await query("SELECT 1");
          parts.push("database: ok");
        } catch (err) {
          parts.push(`database: error (${err instanceof Error ? err.message : "unknown"})`);
        }
      } else {
        parts.push("database: not configured");
      }
      return { text: parts.join("\n") };
    },
  });

  registerCommand({
    name: "providers",
    description: "List AI providers and their status.",
    handler: () => {
      const rows = aiRouterStatus().map(
        (p) => `${p.enabled ? "✅" : "⚪️"} ${p.id}${p.enabled ? ` (${p.keyCount} key${p.keyCount === 1 ? "" : "s"})` : ""}`,
      );
      return { text: ["AI providers:", ...rows].join("\n") };
    },
  });

  registerCommand({
    name: "config",
    description: "Show current default AI configuration.",
    permission: "admin",
    handler: () => ({
      text: [
        `DEFAULT_AI_PROVIDER: ${process.env.DEFAULT_AI_PROVIDER ?? "lovable"}`,
        `DEFAULT_AI_MODEL: ${process.env.DEFAULT_AI_MODEL ?? "(provider default)"}`,
        `LOG_LEVEL: ${process.env.LOG_LEVEL ?? "info"}`,
      ].join("\n"),
    }),
  });

  registerCommand({
    name: "ai-chat",
    aliases: ["ai", "chat", "ask"],
    description: "Chat with the AI router. Usage: ai-chat <prompt>",
    usage: "ai-chat <prompt>",
    handler: async (ctx) => {
      const prompt = ctx.args.join(" ").trim();
      if (!prompt) return { text: "Usage: ai-chat <prompt>" };
      const res = await routeChat({
        messages: [{ role: "user", content: prompt }],
      });
      return { text: res.content || "(empty response)" };
    },
  });
}
