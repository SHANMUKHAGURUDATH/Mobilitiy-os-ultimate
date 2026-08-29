import { Router } from 'express'
import multer from 'multer'
import { requireDb } from '../db/pool'
import { optionalAuth, type AuthedRequest } from '../middleware/auth'
import { saveBuffer, deleteFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../storage'
import { writeAuditLog } from '../lib/audit'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPG, PNG, MP4.`))
    }
    cb(null, true)
  },
})

router.post('/upload', optionalAuth, upload.single('file'), async (req: AuthedRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (expected multipart field "file")' })
    const pool = requireDb()
    const { vehicleId, incidentId, kind } = req.body as { vehicleId?: string; incidentId?: string; kind?: string }

    const { storageUrl, key } = await saveBuffer(req.file.buffer, req.file.originalname, req.file.mimetype)

    const { rows } = await pool.query(
      `INSERT INTO vehicle_documents (file_name, file_type, size, storage_url, kind, status, uploaded_by, vehicle_id, incident_id)
       VALUES ($1,$2,$3,$4,$5,'VALID',$6,$7,$8)
       RETURNING *`,
      [req.file.originalname, req.file.mimetype, req.file.size, storageUrl, kind ?? null, req.user?.id === 'anonymous' ? null : req.user?.id, vehicleId || null, incidentId || null]
    )
    await writeAuditLog({ userId: req.user?.id, action: 'DOCUMENT_UPLOADED', entity: 'document', entityId: rows[0].id, meta: { key } })
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
})

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const { vehicleId, incidentId, search } = req.query as Record<string, string>
    const clauses: string[] = []
    const params: unknown[] = []
    if (vehicleId) { params.push(vehicleId); clauses.push(`vehicle_id = $${params.length}`) }
    if (incidentId) { params.push(incidentId); clauses.push(`incident_id = $${params.length}`) }
    if (search) { params.push(`%${search}%`); clauses.push(`file_name ILIKE $${params.length}`) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const { rows } = await pool.query(`SELECT * FROM vehicle_documents ${where} ORDER BY created_at DESC LIMIT 500`, params)
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const pool = requireDb()
    const { rows } = await pool.query('DELETE FROM vehicle_documents WHERE id = $1 RETURNING *', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Document not found' })
    if (rows[0].storage_url?.startsWith('/uploads/')) {
      await deleteFile(rows[0].storage_url.replace('/uploads/', ''))
    }
    await writeAuditLog({ userId: req.user?.id, action: 'DOCUMENT_DELETED', entity: 'document', entityId: String(req.params.id) })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router
