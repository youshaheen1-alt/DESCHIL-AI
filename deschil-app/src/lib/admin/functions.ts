import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { aiRouterStatus } from "@/lib/ai/router";
import { getSessionUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { dispatch, ensureCommandsReady, listCommands } from "@/lib/commands";
import { APP_VERSION } from "@/lib/commands/core";
import { query } from "@/lib/db/client";

async function requireUser() {
  const sid = getCookie(SESSION_COOKIE_NAME);
  const user = await getSessionUser(sid);
  if (!user) throw new Error("Not signed in");
  return user;
}

export const runCommand = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ command: z.string().min(1).max(4000) }).parse(input))
  .handler(async ({ data }): Promise<{ text: string }> => {
    ensureCommandsReady();
    const user = await requireUser();
    const result = await dispatch({
      platform: "web",
      userId: user.id,
      userEmail: user.email,
      roles: user.roles,
      raw: data.command,
      args: [],
      reply: async () => undefined,
    });
    return { text: result.text ?? "" };
  });

export const getServerStatus = createServerFn({ method: "GET" }).handler(async () => {
  ensureCommandsReady();
  await requireUser();
  return {
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
  };
});

export const getRecentAudit = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  if (!user.roles.includes("admin")) throw new Error("Admin only");
  if (!process.env.DATABASE_URL) return { rows: [] };
  const { rows } = await query<{
    id: string;
    platform: string;
    command: string;
    success: boolean;
    error: string | null;
    created_at: string;
  }>(
    `SELECT id, platform, command, success, error, created_at
     FROM command_audit ORDER BY created_at DESC LIMIT 50`,
  );
  return { rows };
});
