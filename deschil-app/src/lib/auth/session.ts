import { randomBytes } from "node:crypto";
import { query } from "../db/client";

const SESSION_COOKIE = "deschil_sid";
const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  locale: string;
  roles: string[];
}

export function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [id, userId, expiresAt],
  );
  return { id, expiresAt };
}

export async function getSessionUser(sessionId: string | undefined): Promise<SessionUser | null> {
  if (!sessionId) return null;
  const { rows } = await query<{
    id: string;
    email: string;
    display_name: string | null;
    locale: string;
    roles: string[] | null;
  }>(
    `SELECT u.id, u.email, u.display_name, u.locale,
            COALESCE(array_agg(r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN user_roles r ON r.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > now()
     GROUP BY u.id`,
    [sessionId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    locale: row.locale,
    roles: row.roles ?? [],
  };
}

export async function destroySession(sessionId: string): Promise<void> {
  await query("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;
