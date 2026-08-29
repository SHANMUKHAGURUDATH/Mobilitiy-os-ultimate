import { Router } from 'express'
import { checkDbConnection } from '../db/pool'
import { isStorageConfigured, storageProviderName } from '../storage'

const router = Router()

router.get('/health', async (_req, res) => {
  const db = await checkDbConnection()

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
  let ai: { status: string; detail?: string } = { status: 'NOT_CONFIGURED' }
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 2000)
    const r = await fetch(`${aiServiceUrl}/health`, { signal: controller.signal })
    clearTimeout(t)
    ai = r.ok ? { status: 'CONNECTED' } : { status: 'DEGRADED', detail: `HTTP ${r.status}` }
  } catch (e: any) {
    ai = { status: 'ERROR', detail: e.message }
  }

  const googleMapsConfigured = Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY)
  // Frontend key can't be checked server-side (it's a Vite build-time var, not
  // available in this Node process) — the frontend's own /system page checks
  // import.meta.env.VITE_GOOGLE_MAPS_API_KEY directly.

  res.json({
    backend: { status: 'CONNECTED' },
    database: db.ok ? { status: 'CONNECTED' } : { status: db.error?.includes('not set') ? 'NOT_CONFIGURED' : 'ERROR', detail: db.error },
    googleMapsServerKey: { status: googleMapsConfigured ? 'CONNECTED' : 'NOT_CONFIGURED' },
    aiService: ai,
    storage: { status: isStorageConfigured() ? 'CONNECTED' : 'NOT_CONFIGURED', provider: storageProviderName() },
    websocket: { status: 'CONNECTED', path: '/ws/live' },
    simulationMode: process.env.SIMULATION_MODE === 'true',
    checkedAt: new Date().toISOString(),
  })
})

export default router
