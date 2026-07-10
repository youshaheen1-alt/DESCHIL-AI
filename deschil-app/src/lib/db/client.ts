import { Pool } from "pg";

let _pool: Pool | null = null;

/**
 * Determine the SSL configuration for PostgreSQL.
 *
 * - PGSSL=disable  → no SSL (for local development without SSL)
 * - PGSSL=require  → SSL with full certificate validation (production default)
 * - PGSSL=no-verify → SSL without cert validation (use only for legacy/self-signed CAs)
 * - Default for Railway/cloud URLs → SSL with full certificate validation
 * - Default for localhost/127.0.0.1 → no SSL
 *
 * ⚠  rejectUnauthorized is never set to false by default; disabling cert
 *    verification opens the connection to MITM attacks and must be an
 *    explicit operator opt-in via PGSSL=no-verify.
 */
function getSslConfig(
  connectionString: string,
): Pool["options"] extends { ssl?: infer S } ? S : never {
  const mode = (process.env.PGSSL ?? "").toLowerCase();

  if (mode === "disable") return false as never;
  if (mode === "no-verify") return { rejectUnauthorized: false } as never;

  // If the operator explicitly requested strict SSL, always honour it.
  if (mode === "require") return { rejectUnauthorized: true } as never;

  // Auto-detect: skip SSL for local connections; require it for cloud/Railway.
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("@host.docker.internal");

  if (isLocal) return false as never;

  // Cloud/Railway: default to strict TLS.
  return { rejectUnauthorized: true } as never;
}

export function getPool(): Pool {
  if (_pool) return _pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  _pool = new Pool({
    connectionString,
    ssl: getSslConfig(connectionString),
    max: 10,
  });
  return _pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<{ rows: T[] }> {
  const pool = getPool();
  const result = await pool.query(text, params as never[]);
  return { rows: result.rows as T[] };
}
