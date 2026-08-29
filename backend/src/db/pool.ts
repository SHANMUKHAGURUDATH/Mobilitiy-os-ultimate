import { Pool } from 'pg'

// Real PostgreSQL connection. If DATABASE_URL is missing, we don't crash the
// whole process (so /api/system/health can report DB as NOT_CONFIGURED
// instead of the server refusing to boot), but every DB-backed route will
// return a clear 503 until it's set.
const connectionString = process.env.DATABASE_URL

export const pool = connectionString
  ? new Pool({ connectionString })
  : null

export function isDbConfigured() {
  return pool !== null
}

export async function checkDbConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!pool) return { ok: false, error: 'DATABASE_URL not set' }
  try {
    await pool.query('SELECT 1')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

/** Throws a typed error the route layer turns into HTTP 503 when DB isn't configured. */
export function requireDb(): Pool {
  if (!pool) {
    const err: any = new Error('Database is not configured. Set DATABASE_URL in backend/.env')
    err.status = 503
    throw err
  }
  return pool
}
