/**
 * PostgreSQL connection pool.
 *
 * SSL configuration is controlled by the PGSSL environment variable:
 *
 *   PGSSL=disable     → no SSL (local development)
 *   PGSSL=require     → SSL with full certificate validation (strict)
 *   PGSSL=no-verify   → SSL without cert validation (legacy/self-signed CAs)
 *   (unset)           → auto: no SSL for localhost, rejectUnauthorized:false
 *                       for all cloud/Railway URLs (required for Railway Postgres
 *                       which uses self-signed certificates in its chain)
 *
 * Railway Postgres always presents a self-signed certificate chain.
 * Setting rejectUnauthorized:true causes "self-signed certificate in
 * certificate chain" and the connection is refused. The default for
 * cloud URLs is therefore rejectUnauthorized:false. Use PGSSL=require
 * only when you supply your own CA bundle via NODE_EXTRA_CA_CERTS.
 */
import { Pool } from "pg";
import { logger } from "../logger";

const log = logger.child({ mod: "db" });

let _pool: Pool | null = null;

function getSslConfig(connectionString: string): Pool["options"] extends { ssl?: infer S } ? S : never {
  const mode = (process.env.PGSSL ?? "").toLowerCase().trim();

  if (mode === "disable") return false as never;
  if (mode === "require") return { rejectUnauthorized: true } as never;
  if (mode === "no-verify") return { rejectUnauthorized: false } as never;

  // Auto-detect: no SSL for local connections.
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("@host.docker.internal") ||
    connectionString.includes("@db.local");

  if (isLocal) return false as never;

  // Cloud/Railway: use SSL but disable certificate validation because
  // Railway's managed Postgres uses a self-signed certificate chain.
  // Users can override with PGSSL=require + NODE_EXTRA_CA_CERTS for
  // strict validation.
  return { rejectUnauthorized: false } as never;
}

export function getPool(): Pool {
  if (_pool) return _pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — cannot connect to PostgreSQL");
  }
  const ssl = getSslConfig(connectionString);
  _pool = new Pool({
    connectionString,
    ssl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  _pool.on("error", (err) => {
    log.error("pool.error", { error: err.message });
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

/** Gracefully drain the pool. Call on process shutdown. */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
