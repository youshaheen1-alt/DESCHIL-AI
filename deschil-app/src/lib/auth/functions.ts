import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { bootstrapDatabase } from "../db/bootstrap";
import { query } from "../db/client";
import { hashPassword, verifyPassword } from "./password";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSession,
  destroySession,
  getSessionUser,
  type SessionUser,
} from "./session";

const CredentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
  displayName: z.string().max(80).optional(),
});

async function ensureBootstrap() {
  await bootstrapDatabase();
}

function writeSessionCookie(id: string) {
  setCookie(SESSION_COOKIE_NAME, id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
  });
}

function clearSessionCookie() {
  setCookie(SESSION_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export const signUp = createServerFn({ method: "POST" })
  .validator((input: unknown) => CredentialsSchema.parse(input))
  .handler(async ({ data }) => {
    await ensureBootstrap();
    const email = data.email.toLowerCase().trim();
    const existing = await query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      throw new Error("An account with this email already exists.");
    }
    const passwordHash = await hashPassword(data.password);
    const { rows } = await query<{ id: string }>(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id",
      [email, passwordHash, data.displayName ?? null],
    );
    const userId = rows[0].id;
    const { rows: count } = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM users",
    );
    const initialRole = count[0].count === "1" ? "admin" : "user";
    await query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", [userId, initialRole]);
    const session = await createSession(userId);
    writeSessionCookie(session.id);
    return { ok: true as const };
  });

export const signIn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    await ensureBootstrap();
    const email = data.email.toLowerCase().trim();
    const { rows } = await query<{ id: string; password_hash: string }>(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email],
    );
    const row = rows[0];
    if (!row) throw new Error("Invalid email or password.");
    const ok = await verifyPassword(data.password, row.password_hash);
    if (!ok) throw new Error("Invalid email or password.");
    const session = await createSession(row.id);
    writeSessionCookie(session.id);
    return { ok: true as const };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const sid = getCookie(SESSION_COOKIE_NAME);
  if (sid) await destroySession(sid);
  clearSessionCookie();
  return { ok: true as const };
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    await ensureBootstrap();
    const sid = getCookie(SESSION_COOKIE_NAME);
    return getSessionUser(sid);
  },
);
