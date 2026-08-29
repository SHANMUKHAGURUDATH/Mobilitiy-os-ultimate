import { Router } from 'express'
import { requireDb } from '../db/pool'
import { optionalAuth, type AuthedRequest } from '../middleware/auth'

const router = Router()

router.get('/', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const pool = requireDb()
    // Global (userId IS NULL) + this user's own notifications
    const userId = req.user?.id && req.user.id !== 'anonymous' ? req.user.id : null
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE user_id IS NULL OR user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

router.put('/:id/read', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const { rows } = await pool.query(`UPDATE notifications SET read = true WHERE id = $1 RETURNING *`, [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Notification not found' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

export default router
