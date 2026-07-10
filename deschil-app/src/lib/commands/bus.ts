/**
 * Command Bus — single dispatcher shared by every platform.
 * - registerCommand auto-registers by name and aliases
 * - middleware runs in insertion order around the handler
 * - permissions are enforced from ctx.roles
 * - every execution is audited to command_audit (best effort)
 */
import { query } from "../db/client";
import { logger } from "../logger";
import type {
  CommandContext,
  CommandDefinition,
  CommandMiddleware,
  CommandResult,
  Permission,
} from "./types";

const registry = new Map<string, CommandDefinition>();
const middlewares: CommandMiddleware[] = [];
const log = logger.child({ mod: "command-bus" });

export function registerCommand(cmd: CommandDefinition): void {
  const names = [cmd.name, ...(cmd.aliases ?? [])].map((n) => n.toLowerCase());
  for (const n of names) {
    if (registry.has(n)) log.warn("command.override", { name: n });
    registry.set(n, cmd);
  }
}

export function useMiddleware(mw: CommandMiddleware): void {
  middlewares.push(mw);
}

export function listCommands(): CommandDefinition[] {
  const seen = new Set<CommandDefinition>();
  return Array.from(registry.values()).filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

export function getCommand(name: string): CommandDefinition | undefined {
  return registry.get(name.toLowerCase());
}

function permissionOk(cmd: CommandDefinition, ctx: CommandContext): boolean {
  const need: Permission = cmd.permission ?? "public";
  if (need === "public") return true;
  if (need === "user") return Boolean(ctx.userId);
  if (need === "admin") return ctx.roles.includes("admin");
  return false;
}

async function audit(
  ctx: CommandContext,
  name: string,
  success: boolean,
  output: string,
  error?: string,
): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    await query(
      `INSERT INTO command_audit (user_id, platform, command, input, output, success, error)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
      [
        ctx.userId ?? null,
        ctx.platform,
        name,
        JSON.stringify({ args: ctx.args, raw: ctx.raw }),
        output.slice(0, 4000),
        success,
        error ?? null,
      ],
    );
  } catch (err) {
    log.warn("audit.failed", { error: err instanceof Error ? err.message : String(err) });
  }
}

export function parseCommand(raw: string): { name: string; args: string[] } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withoutPrefix = trimmed.startsWith("/") || trimmed.startsWith("!") ? trimmed.slice(1) : trimmed;
  const parts = withoutPrefix.split(/\s+/);
  const name = parts.shift()?.toLowerCase();
  if (!name) return null;
  return { name, args: parts };
}

export async function dispatch(ctx: CommandContext): Promise<CommandResult> {
  const parsed = parseCommand(ctx.raw);
  if (!parsed) {
    return { text: "Empty command." };
  }
  ctx.args = parsed.args;
  const cmd = getCommand(parsed.name);
  if (!cmd) {
    const msg = `Unknown command: ${parsed.name}. Try 'help'.`;
    await audit(ctx, parsed.name, false, msg, "not_found");
    return { text: msg };
  }
  if (!permissionOk(cmd, ctx)) {
    const msg = `Permission denied for '${cmd.name}'.`;
    await audit(ctx, cmd.name, false, msg, "forbidden");
    return { text: msg };
  }
  const execute = async (): Promise<CommandResult> => cmd.handler(ctx);
  // Build middleware chain
  const chain = middlewares.reduceRight<() => Promise<CommandResult>>(
    (next, mw) => () => mw(ctx, next),
    execute,
  );
  try {
    const result = await chain();
    await audit(ctx, cmd.name, true, result.text ?? "");
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("command.failed", { name: cmd.name, error: msg });
    await audit(ctx, cmd.name, false, "", msg);
    return { text: `Error: ${msg}` };
  }
}
