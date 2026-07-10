/**
 * Authentication server functions (TanStack Start server actions).
 *
 * Admin bootstrap via environment variables:
 *   If DESCHIL_USER (email) and DESCHIL_PASSWORD are set, signing in with
 *   those exact credentials always succeeds and grants the admin role — even
 *   before any user has registered. The admin account is automatically created
 *   (or updated to have the admin role) in the database on each successful
 *   env-based login, so the session is fully DB-backed.
 */
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
  password: z.string().min(1).max(200),
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

/**
 * Upsert the admin user from environment variables and return their DB id.
 * Called only when DESCHIL_USER + DESCHIL_PASSWORD match the sign-in attempt.
 */
async function upsertEnvAdmin(email: string): Promise<string> {
  // Create user if it doesn't exist yet
  await query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, 'Admin')
     ON CONFLICT (email) DO NOTHING`,
    [email, "env-admin-no-password"],
  );

  const { rows } = await query<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );
  const userId = rows[0]?.id;
  if (!userId) throw new Error("Failed to upsert admin user");

  // Ensure the admin role is present
  await query(
    `INSERT INTO user_roles (user_id, role)
     VALUES ($1, 'admin')
     ON CONFLICT (user_id, role) DO NOTHING`,
    [userId],
  );

  return userId;
}

export const signUp = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    CredentialsSchema.extend({ password: z.string().min(8).max(200) }).parse(input),
  )
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
    // First registered user becomes admin
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

    // ── Admin via environment variables ──────────────────────────────────────
    // If DESCHIL_USER and DESCHIL_PASSWORD are set and the credentials match
    // exactly, we bypass the database password check and ensure the account
    // exists with the admin role. This allows the operator to always log in
    // even on a fresh database.
    const envUser = (process.env.DESCHIL_USER ?? "").toLowerCase().trim();
    const envPass = process.env.DESCHIL_PASSWORD ?? "";
    if (envUser && envPass && email === envUser && data.password === envPass) {
      const userId = await upsertEnvAdmin(email);
      const session = await createSession(userId);
      writeSessionCookie(session.id);
      return { ok: true as const };
    }

    // ── Normal database login ─────────────────────────────────────────────────
    const { rows } = await query<{ id: string; password_hash: string }>(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email],
    );
    const row = rows[0];
    // Use constant-time comparison path: always run verifyPassword even when
    // no row exists so we don't leak timing information about account existence.
    if (!row) {
      // Dummy hash to prevent timing oracle
      await verifyPassword(data.password, "scrypt$0000000000000000000000000000000000$0000").catch(() => undefined);
      throw new Error("Invalid email or password.");
    }
    const ok = await verifyPassword(data.password, row.password_hash);
    if (!ok) throw new Error("Invalid email or password.");
    // If this user is the env admin but logged in via a DB password, keep their
    // admin role in sync.
    if (envUser && email === envUser) {
      await query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT (user_id, role) DO NOTHING`,
        [row.id],
      );
    }
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
