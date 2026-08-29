import { Router } from 'express'

const router = Router()

interface EmergencyAlert {
  id: string
  type: string
  position: { lat: number; lng: number }
  createdAt: string
  status: 'DISPATCHED'
}

const alerts: EmergencyAlert[] = []

// DEMO ONLY: this simulates dispatch and never contacts a real emergency
// service. A production integration would call an authorized government/
// emergency-services API here, behind explicit operator confirmation.
router.post('/sos', (req, res) => {
  const { type, position } = req.body || {}
  if (!type || !position) return res.status(400).json({ error: 'type and position are required' })
  const alert: EmergencyAlert = {
    id: `SOS-${alerts.length + 1}`,
    type,
    position,
    createdAt: new Date().toISOString(),
    status: 'DISPATCHED',
  }
  alerts.push(alert)
  res.status(201).json({ ...alert, note: 'Simulated dispatch — no real emergency service was contacted.' })
})

router.get('/sos', (_req, res) => {
  res.json(alerts)
})

export default router
