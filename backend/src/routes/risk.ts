import { Router } from 'express'
import { generateRiskZones } from '../data/risk'

const router = Router()
let cachedZones = generateRiskZones(24)

// Regenerate periodically to simulate a live-scoring engine re-evaluating conditions.
setInterval(() => { cachedZones = generateRiskZones(24) }, 30_000)

router.get('/', (_req, res) => {
  res.json(cachedZones)
})

export default router
