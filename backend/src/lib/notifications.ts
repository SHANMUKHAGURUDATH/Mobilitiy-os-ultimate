import { pool } from '../db/pool'
import { broadcast } from '../ws/live'

export async function createNotification(entry: {
  userId?: string | null
  type: string
  title: string
  message: string
}) {
  if (!pool) return null
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, type, title, message, read, created_at`,
    [entry.userId ?? null, entry.type, entry.title, entry.message]
  )
  const notification = rows[0]
  broadcast('notification', notification)
  return notification
}
