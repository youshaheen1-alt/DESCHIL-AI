/**
 * Minimal structured JSON logger. Works on Node and edge runtimes.
 * Levels: debug, info, warn, error.
 */
type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentThreshold(): number {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase() as Level;
  return LEVEL_ORDER[raw] ?? LEVEL_ORDER.info;
}

function emit(level: Level, msg: string, ctx?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < currentThreshold()) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(ctx ?? {}),
  };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else if (level === "warn") console.warn(text);
  else console.log(text);
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, ctx),
  child(bindings: Record<string, unknown>) {
    return {
      debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", msg, { ...bindings, ...ctx }),
      info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, { ...bindings, ...ctx }),
      warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, { ...bindings, ...ctx }),
      error: (msg: string, ctx?: Record<string, unknown>) => emit("error", msg, { ...bindings, ...ctx }),
    };
  },
};
