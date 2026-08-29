import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { createServer } from 'http'

import { attachLiveChannel } from './ws/live'
import { attachVehicleSimulation } from './ws/simulation'
import { pool } from './db/pool'
import { sweepStaleVehicles } from './routes/vehicles'

import authRoutes from './routes/auth'
import vehicleRoutes from './routes/vehicles'
import documentRoutes from './routes/documents'
import incidentRoutes from './routes/incidents'
import citizenReportRoutes from './routes/citizen-reports'
import notificationRoutes from './routes/notifications'
import systemRoutes from './routes/system'
import riskRoutes from './routes/risk'
import hazardousRoutes from './routes/hazardous'
import emergencyRoutes from './routes/emergency'
import verificationRoutes from './routes/verification'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Uploaded files served back for LOCAL storage mode (see src/storage/index.ts)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

const SIMULATION_MODE = process.env.SIMULATION_MODE === 'true'

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mobility-os-backend', mode: SIMULATION_MODE ? 'SIMULATION' : 'LIVE' })
})

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/evidence', documentRoutes) // legacy alias, documents shared by evidence uploader
app.use('/api/documents', documentRoutes)
app.use('/api/incidents', incidentRoutes)
app.use('/api/citizen-reports', citizenReportRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/system', systemRoutes)
app.use('/api/risk-zones', riskRoutes)
app.use('/api/hazardous-vehicles', hazardousRoutes)
app.use('/api/emergency', emergencyRoutes)
app.use('/api/verification', verificationRoutes)

// Centralized error handler — every route above calls next(err) on failure
// instead of leaking stack traces or silently swallowing errors.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || 500
  if (status >= 500) console.error(err)
  res.status(status).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const server = createServer(app)

// REAL real-time channel: only emits events triggered by actual DB writes.
attachLiveChannel(server)

// SIMULATION channel: isolated, only started when explicitly enabled.
if (SIMULATION_MODE) {
  attachVehicleSimulation(server)
  console.log('SIMULATION_MODE=true — /ws/simulation is generating demo vehicle movement.')
} else {
  console.log('LIVE mode — /ws/simulation is NOT running. Only real GPS posts to /api/vehicles/:id/location will move markers.')
}

// Real heartbeat sweep: marks vehicles STALE/OFFLINE based on actual
// last_update_at age. Runs every 15s, only if the DB is configured.
if (pool) {
  const dbPool = pool
  setInterval(() => {
    sweepStaleVehicles(dbPool).catch((err) => console.error('[sweep] failed', err))
  }, 15_000)
}

server.listen(PORT, () => {
  console.log(`Mobility OS backend listening on http://localhost:${PORT}`)
  console.log(`LIVE WebSocket channel at ws://localhost:${PORT}/ws/live`)
  if (!pool) {
    console.warn('DATABASE_URL is not set — DB-backed routes will return 503 until backend/.env is configured and `npm run db:migrate` has been run.')
  }
})
