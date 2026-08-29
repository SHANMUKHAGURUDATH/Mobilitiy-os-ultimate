import { Router } from 'express'
import { z } from 'zod'
import { requireDb } from '../db/pool'
import { optionalAuth, requireRole, type AuthedRequest } from '../middleware/auth'
import { broadcast } from '../ws/live'
import { writeAuditLog } from '../lib/audit'

const router = Router()

const reportSchema = z.object({
  description: z.string().min(1),
  photoUrl: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
})

router.get('/', async (req, res, next) => {
  try {
    const pool = requireDb()
    const { status } = req.query as Record<string, string>
    const clauses: string[] = []; const params: unknown[] = []
    if (status) { params.push(status); clauses.push(`status = $${params.length}`) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const { rows } = await pool.query(`SELECT * FROM citizen_reports ${where} ORDER BY created_at DESC LIMIT 500`, params)
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const parsed = reportSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid report' })
    const b = parsed.data
    const pool = requireDb()
    const reporterId = req.user?.id && req.user.id !== 'anonymous' ? req.user.id : null
    const { rows } = await pool.query(
      `INSERT INTO citizen_reports (reporter_id, description, photo_url, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [reporterId, b.description, b.photoUrl ?? null, b.latitude, b.longitude]
    )
    broadcast('citizen_report', rows[0])
    await writeAuditLog({ userId: reporterId, action: 'CITIZEN_REPORT_CREATED', entity: 'citizen_report', entityId: rows[0].id })
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

router.put('/:id', optionalAuth, requireRole('SUPER_ADMIN', 'AUTHORITY'), async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({ status: z.enum(['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']) })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'status is required' })
    const pool = requireDb()
    const { rows } = await pool.query(
      `UPDATE citizen_reports SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`,
      [parsed.data.status, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Report not found' })
    broadcast('citizen_report', rows[0])
    await writeAuditLog({ userId: req.user?.id, action: 'CITIZEN_REPORT_UPDATED', entity: 'citizen_report', entityId: rows[0].id })
    res.json(rows[0])
  } catch (err) { next(err) }
})

export default router
