import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { requireDb } from '../db/pool'
import { optionalAuth, type AuthedRequest } from '../middleware/auth'
import { saveBuffer, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../storage'
import { broadcast } from '../ws/live'
import { writeAuditLog } from '../lib/audit'
import { createNotification } from '../lib/notifications'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) return cb(new Error(`Unsupported file type: ${file.mimetype}`))
    cb(null, true)
  },
})

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

const incidentSchema = z.object({
  type: z.enum(['HIT_AND_RUN', 'RASH_DRIVING', 'ACCIDENT', 'POTHOLE', 'FLOODING', 'SIGNAL_FAULT', 'FALLEN_TREE', 'BLOCKAGE', 'CONSTRUCTION', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  latitude: z.number(), longitude: z.number(),
  description: z.string().optional(),
  vehicleId: z.string().uuid().optional().nullable(),
})

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const { status, severity, limit = '200' } = req.query as Record<string, string>
    const clauses: string[] = []
    const params: unknown[] = []
    if (status) { params.push(status); clauses.push(`status = $${params.length}`) }
    if (severity) { params.push(severity); clauses.push(`severity = $${params.length}`) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    params.push(Math.min(Number(limit) || 200, 500))
    const { rows } = await pool.query(`SELECT * FROM incidents ${where} ORDER BY created_at DESC LIMIT $${params.length}`, params)
    res.json(rows)
  } catch (err) { next(err) }
})

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const incident = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id])
    if (!incident.rows[0]) return res.status(404).json({ error: 'Incident not found' })
    const evidence = await pool.query('SELECT * FROM evidence WHERE incident_id = $1 ORDER BY created_at DESC', [req.params.id])
    res.json({ ...incident.rows[0], evidence: evidence.rows })
  } catch (err) { next(err) }
})

router.post('/', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const parsed = incidentSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid incident payload' })
    const b = parsed.data
    const pool = requireDb()
    const { rows } = await pool.query(
      `INSERT INTO incidents (type, severity, latitude, longitude, description, vehicle_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [b.type, b.severity ?? 'MEDIUM', b.latitude, b.longitude, b.description ?? null, b.vehicleId ?? null]
    )
    const incident = rows[0]
    broadcast('incident', incident)
    await writeAuditLog({ userId: req.user?.id, action: 'INCIDENT_CREATED', entity: 'incident', entityId: incident.id })
    if (incident.severity === 'CRITICAL' || incident.severity === 'HIGH') {
      await createNotification({ type: 'INCIDENT', title: `${incident.severity} incident reported`, message: `${incident.type} at (${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)})` })
    }
    res.status(201).json(incident)
  } catch (err) { next(err) }
})

router.put('/:id', optionalAuth, requireStatusRole, async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(['OPEN', 'INVESTIGATING', 'ASSIGNED', 'RESOLVED', 'REJECTED']).optional(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      assignedTo: z.string().optional(),
      plateNumber: z.string().optional(),
      plateConfidence: z.number().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid update payload' })
    const b = parsed.data
    const pool = requireDb()
    const fields: string[] = []; const params: unknown[] = []
    for (const [col, val] of Object.entries({ status: b.status, severity: b.severity, assigned_to: b.assignedTo, plate_number: b.plateNumber, plate_confidence: b.plateConfidence })) {
      if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`) }
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    fields.push('updated_at = now()')
    params.push(req.params.id)
    const { rows } = await pool.query(`UPDATE incidents SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params)
    if (!rows[0]) return res.status(404).json({ error: 'Incident not found' })
    broadcast('incident', rows[0])
    await writeAuditLog({ userId: req.user?.id, action: 'INCIDENT_UPDATED', entity: 'incident', entityId: rows[0].id, meta: b })
    res.json(rows[0])
  } catch (err) { next(err) }
})

function requireStatusRole(req: AuthedRequest, res: any, next: any) {
  if (!req.user || !['SUPER_ADMIN', 'AUTHORITY'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only AUTHORITY or SUPER_ADMIN can update incident status' })
  }
  next()
}

// -------------------------------------------------------------------------
// Evidence upload -> real storage -> optional AI processing (OCR / detection)
// -------------------------------------------------------------------------
router.post('/:id/evidence', optionalAuth, upload.single('file'), async (req: AuthedRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (expected multipart field "file")' })
    const pool = requireDb()
    const incident = await pool.query('SELECT id FROM incidents WHERE id = $1', [req.params.id])
    if (!incident.rowCount) return res.status(404).json({ error: 'Incident not found' })

    const { storageUrl } = await saveBuffer(req.file.buffer, req.file.originalname, req.file.mimetype)
    const { rows } = await pool.query(
      `INSERT INTO evidence (incident_id, file_name, file_type, storage_url, status)
       VALUES ($1,$2,$3,$4,'UPLOADED') RETURNING *`,
      [req.params.id, req.file.originalname, req.file.mimetype, storageUrl]
    )
    const evidence = rows[0]
    await writeAuditLog({ userId: req.user?.id, action: 'EVIDENCE_UPLOADED', entity: 'evidence', entityId: evidence.id })
    res.status(201).json(evidence)
  } catch (err) { next(err) }
})

// Dispatches evidence to the AI microservice for plate OCR. Honest about
// failure: if the AI service isn't reachable/configured, status is FAILED
// with a real error message — never a fabricated result.
router.post('/:incidentId/evidence/:evidenceId/analyze', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const pool = requireDb()
    const ev = await pool.query('SELECT * FROM evidence WHERE id = $1 AND incident_id = $2', [req.params.evidenceId, req.params.incidentId])
    if (!ev.rows[0]) return res.status(404).json({ error: 'Evidence not found' })
    const evidence = ev.rows[0]

    await pool.query(`UPDATE evidence SET status = 'PROCESSING' WHERE id = $1`, [evidence.id])
    const aiRow = await pool.query(
      `INSERT INTO ai_analyses (evidence_id, kind, status) VALUES ($1, 'plate_ocr', 'PROCESSING') RETURNING id`,
      [evidence.id]
    )

    try {
      const fileUrl = evidence.storage_url.startsWith('http')
        ? evidence.storage_url
        : `${req.protocol}://${req.get('host')}${evidence.storage_url}`
      const aiRes = await fetch(`${AI_SERVICE_URL}/ai/plate-ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl }),
      })
      if (!aiRes.ok) throw new Error(`AI service responded ${aiRes.status}`)
      const result = await aiRes.json()

      await pool.query(`UPDATE ai_analyses SET status='COMPLETED', result_json=$1, model_name=$2 WHERE id=$3`, [JSON.stringify(result), result.model ?? 'tesseract-ocr', aiRow.rows[0].id])
      await pool.query(`UPDATE evidence SET status='COMPLETED' WHERE id=$1`, [evidence.id])
      if (result.plate_number) {
        await pool.query(`UPDATE incidents SET plate_number=$1, plate_confidence=$2, updated_at=now() WHERE id=$3`, [result.plate_number, result.confidence, req.params.incidentId])
      }
      res.json({ status: 'COMPLETED', result })
    } catch (aiErr: any) {
      await pool.query(`UPDATE ai_analyses SET status='FAILED', result_json=$1 WHERE id=$2`, [JSON.stringify({ error: aiErr.message }), aiRow.rows[0].id])
      await pool.query(`UPDATE evidence SET status='FAILED' WHERE id=$1`, [evidence.id])
      res.status(502).json({ status: 'FAILED', error: `AI service unavailable: ${aiErr.message}` })
    }
  } catch (err) { next(err) }
})

export default router
