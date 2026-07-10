export type Platform = "web" | "telegram" | "whatsapp" | "discord" | "api";

export type Permission = "public" | "user" | "admin";

export interface CommandContext {
  platform: Platform;
  userId?: string;
  userEmail?: string;
  roles: string[];
  raw: string;
  args: string[];
  externalId?: string;
  reply: (text: string) => Promise<void> | void;
}

export interface CommandResult {
  text?: string;
  data?: unknown;
}

export interface CommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  permission?: Permission;
  usage?: string;
  handler: (ctx: CommandContext) => Promise<CommandResult> | CommandResult;
}

export type CommandMiddleware = (
  ctx: CommandContext,
  next: () => Promise<CommandResult>,
) => Promise<CommandResult>;
