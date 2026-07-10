import { getPool } from "./client";

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'operator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT NOT NULL,
  display TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

CREATE TABLE IF NOT EXISTS link_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS command_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  command TEXT NOT NULL,
  input JSONB,
  output TEXT,
  success BOOLEAN NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS command_audit_user_idx ON command_audit(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

let bootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

export function bootstrapDatabase(): Promise<void> {
  if (bootstrapped) return Promise.resolve();
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    if (!process.env.DATABASE_URL) {
      console.warn("[db] DATABASE_URL not set — skipping bootstrap");
      return;
    }
    try {
      const pool = getPool();
      await pool.query(SCHEMA_SQL);
      bootstrapped = true;
      console.log("[db] schema ready");
    } catch (err) {
      bootstrapPromise = null;
      console.error("[db] bootstrap failed:", err);
      throw err;
    }
  })();
  return bootstrapPromise;
}
