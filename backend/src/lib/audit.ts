import { pool } from '../db/pool'

export async function writeAuditLog(entry: {
  userId?: string | null
  action: string
  entity?: string
  entityId?: string
  meta?: Record<string, unknown>
}) {
  if (!pool) return // DB not configured — don't block the request over audit logging
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, meta_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [entry.userId ?? null, entry.action, entry.entity ?? null, entry.entityId ?? null, entry.meta ? JSON.stringify(entry.meta) : null]
    )
  } catch (err) {
    console.error('[audit] failed to write audit log', err)
  }
}
