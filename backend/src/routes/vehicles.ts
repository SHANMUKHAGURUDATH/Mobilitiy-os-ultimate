import { Router } from 'express'
import { z } from 'zod'
import { requireDb } from '../db/pool'
import { optionalAuth, requireRole, type AuthedRequest } from '../middleware/auth'
import { broadcast } from '../ws/live'
import { writeAuditLog } from '../lib/audit'
import { createNotification } from '../lib/notifications'

const router = Router()

const vehicleRowToJson = (r: any) => ({
  id: r.id,
  registrationNumber: r.registration_number,
  vehicleType: r.vehicle_type,
  category: r.category,
  operator: r.operator,
  routeName: r.route_name,
  capacity: r.capacity,
  status: r.status,
  gpsDeviceId: r.gps_device_id,
  fuelType: r.fuel_type,
  model: r.model,
  year: r.year,
  lastServiceAt: r.last_service_at,
  insuranceStatus: r.insurance_status,
  permitStatus: r.permit_status,
  driverId: r.driver_id,
  ownerId: r.owner_id,
  position: r.last_lat != null ? { lat: r.last_lat, lng: r.last_lng } : null,
  heading: r.last_heading,
  speedKmh: r.last_speed_kmh,
  lastUpdateAt: r.last_update_at,
  connectionStatus: r.connection_status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

// -------------------------------------------------------------------------
// List / search / filter / sort
// -------------------------------------------------------------------------
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const { search, category, status, sort = 'created_at', order = 'desc', limit = '200' } = req.query as Record<string, string>

    const clauses: string[] = []
    const params: unknown[] = []
    if (search) {
      params.push(`%${search}%`)
      clauses.push(`(registration_number ILIKE $${params.length} OR operator ILIKE $${params.length} OR route_name ILIKE $${params.length})`)
    }
    if (category) {
      params.push(category)
      clauses.push(`category = $${params.length}`)
    }
    if (status) {
      params.push(status)
      clauses.push(`status = $${params.length}`)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const allowedSort = new Set(['created_at', 'registration_number', 'category', 'status', 'last_update_at'])
    const sortCol = allowedSort.has(sort) ? sort : 'created_at'
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
    params.push(Math.min(Number(limit) || 200, 500))

    const { rows } = await pool.query(
      `SELECT * FROM vehicles ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT $${params.length}`,
      params
    )
    res.json(rows.map(vehicleRowToJson))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Vehicle not found' })
    res.json(vehicleRowToJson(rows[0]))
  } catch (err) {
    next(err)
  }
})

const vehicleSchema = z.object({
  registrationNumber: z.string().min(2),
  vehicleType: z.string().min(1),
  category: z.enum(['RTC_BUS', 'COLLEGE_BUS', 'PRIVATE_BUS', 'EMERGENCY', 'HAZMAT', 'TAXI', 'AUTO', 'TRUCK', 'TWO_WHEELER', 'OTHER']),
  operator: z.string().optional(),
  routeName: z.string().optional(),
  capacity: z.number().int().optional(),
  gpsDeviceId: z.string().optional(),
  fuelType: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  driverId: z.string().uuid().optional().nullable(),
})

router.post('/', optionalAuth, requireRole('SUPER_ADMIN', 'AUTHORITY', 'TRANSPORT_OPERATOR'), async (req: AuthedRequest, res, next) => {
  try {
    const parsed = vehicleSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid vehicle payload' })
    const v = parsed.data
    const pool = requireDb()

    const existing = await pool.query('SELECT id FROM vehicles WHERE registration_number = $1', [v.registrationNumber])
    if (existing.rowCount) return res.status(409).json({ error: 'A vehicle with this registration number already exists' })

    const { rows } = await pool.query(
      `INSERT INTO vehicles (registration_number, vehicle_type, category, operator, route_name, capacity, gps_device_id, fuel_type, model, year, driver_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [v.registrationNumber, v.vehicleType, v.category, v.operator ?? null, v.routeName ?? null, v.capacity ?? null, v.gpsDeviceId ?? null, v.fuelType ?? null, v.model ?? null, v.year ?? null, v.driverId ?? null]
    )
    await writeAuditLog({ userId: req.user?.id, action: 'VEHICLE_CREATED', entity: 'vehicle', entityId: rows[0].id })
    res.status(201).json(vehicleRowToJson(rows[0]))
  } catch (err) {
    next(err)
  }
})

router.put('/:id', optionalAuth, requireRole('SUPER_ADMIN', 'AUTHORITY', 'TRANSPORT_OPERATOR'), async (req: AuthedRequest, res, next) => {
  try {
    const parsed = vehicleSchema.partial().safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid vehicle payload' })
    const v = parsed.data
    const pool = requireDb()

    const fields: string[] = []
    const params: unknown[] = []
    const map: Record<string, unknown> = {
      registration_number: v.registrationNumber, vehicle_type: v.vehicleType, category: v.category,
      operator: v.operator, route_name: v.routeName, capacity: v.capacity, gps_device_id: v.gpsDeviceId,
      fuel_type: v.fuelType, model: v.model, year: v.year, driver_id: v.driverId,
    }
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) {
        params.push(val)
        fields.push(`${col} = $${params.length}`)
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    fields.push('updated_at = now()')
    params.push(req.params.id)

    const { rows } = await pool.query(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params)
    if (!rows[0]) return res.status(404).json({ error: 'Vehicle not found' })
    await writeAuditLog({ userId: req.user?.id, action: 'VEHICLE_UPDATED', entity: 'vehicle', entityId: rows[0].id })
    res.json(vehicleRowToJson(rows[0]))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', optionalAuth, requireRole('SUPER_ADMIN', 'AUTHORITY', 'TRANSPORT_OPERATOR'), async (req: AuthedRequest, res, next) => {
  try {
    const pool = requireDb()
    const { rows } = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Vehicle not found' })
    await writeAuditLog({ userId: req.user?.id, action: 'VEHICLE_DELETED', entity: 'vehicle', entityId: String(req.params.id) })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// -------------------------------------------------------------------------
// GPS ingest — this is the one real, un-fakeable entry point for LIVE
// positions. Anything that calls this (a browser via geolocation, a phone
// app, a hardware tracker) produces a real marker move on the dashboard.
// -------------------------------------------------------------------------
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional(),
  heading: z.number().optional(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  timestamp: z.string().optional(),
  source: z.enum(['gps', 'simulation']).optional(),
})

router.post('/:id/location', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const parsed = locationSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid location payload' })
    const p = parsed.data
    const pool = requireDb()

    const vehicle = await pool.query('SELECT id FROM vehicles WHERE id = $1', [req.params.id])
    if (!vehicle.rowCount) return res.status(404).json({ error: 'Vehicle not found' })

    await pool.query(
      `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, speed_kmh, heading, accuracy, altitude, source, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, COALESCE($9::timestamptz, now()))`,
      [req.params.id, p.latitude, p.longitude, p.speed ?? null, p.heading ?? null, p.accuracy ?? null, p.altitude ?? null, p.source ?? 'gps', p.timestamp ?? null]
    )

    const { rows } = await pool.query(
      `UPDATE vehicles SET last_lat=$1, last_lng=$2, last_heading=$3, last_speed_kmh=$4,
              last_update_at = now(), connection_status = 'LIVE', status = 'ON_ROUTE'
       WHERE id = $5 RETURNING *`,
      [p.latitude, p.longitude, p.heading ?? null, p.speed ?? null, req.params.id]
    )

    broadcast('vehicle_location', vehicleRowToJson(rows[0]))
    res.status(201).json(vehicleRowToJson(rows[0]))
  } catch (err) {
    next(err)
  }
})

router.get('/:id/locations', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const limit = Math.min(Number(req.query.limit) || 200, 2000)
    const { rows } = await pool.query(
      `SELECT latitude, longitude, speed_kmh, heading, accuracy, altitude, source, timestamp
       FROM vehicle_locations WHERE vehicle_id = $1 ORDER BY timestamp DESC LIMIT $2`,
      [req.params.id, limit]
    )
    res.json(rows.map((r) => ({
      lat: r.latitude, lng: r.longitude, speedKmh: r.speed_kmh, heading: r.heading,
      accuracy: r.accuracy, altitude: r.altitude, source: r.source, timestamp: r.timestamp,
    })))
  } catch (err) {
    next(err)
  }
})

router.get('/:id/incidents', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const { rows } = await pool.query('SELECT * FROM incidents WHERE vehicle_id = $1 ORDER BY created_at DESC', [req.params.id])
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/documents', optionalAuth, async (req, res, next) => {
  try {
    const pool = requireDb()
    const { rows } = await pool.query('SELECT * FROM vehicle_documents WHERE vehicle_id = $1 ORDER BY created_at DESC', [req.params.id])
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// -------------------------------------------------------------------------
// Background job (called from index.ts on an interval): mark vehicles STALE
// or OFFLINE based on real heartbeat age. Never fakes connection state.
// -------------------------------------------------------------------------
export async function sweepStaleVehicles(pool: import('pg').Pool) {
  const stale = await pool.query(
    `UPDATE vehicles SET connection_status = 'STALE'
     WHERE connection_status = 'LIVE' AND last_update_at < now() - interval '30 seconds'
     RETURNING id, registration_number`
  )
  const offline = await pool.query(
    `UPDATE vehicles SET connection_status = 'OFFLINE', status = 'OFFLINE'
     WHERE connection_status IN ('LIVE','STALE') AND (last_update_at IS NULL OR last_update_at < now() - interval '2 minutes')
     RETURNING id, registration_number`
  )
  for (const v of offline.rows) {
    await createNotification({ type: 'VEHICLE_OFFLINE', title: 'Vehicle offline', message: `${v.registration_number} has gone offline (no heartbeat).` })
    broadcast('vehicle_status', { id: v.id, connectionStatus: 'OFFLINE' })
  }
  for (const v of stale.rows) {
    broadcast('vehicle_status', { id: v.id, connectionStatus: 'STALE' })
  }
}

export default router
