import { Router } from 'express'
import { optionalAuth, requireRole, type AuthedRequest } from '../middleware/auth'

const router = Router()

interface Report {
  id: string
  category: string
  description: string
  submittedAt: string
  status: 'RECEIVED' | 'UNDER_REVIEW' | 'ANOMALY_FLAGGED' | 'CLOSED'
  aiNote?: string
}

const reports: Report[] = [
  {
    id: 'VR-1',
    category: 'SUSPICIOUS_VEHICLE',
    description: 'Vehicle observed with mismatched registration plate pattern',
    submittedAt: new Date().toISOString(),
    status: 'ANOMALY_FLAGGED',
    aiNote: 'Potential anomaly detected — requires official verification.',
  },
]

// Anyone can submit a report (citizen-facing).
router.post('/', (req, res) => {
  const { category, description } = req.body || {}
  if (!category || !description) return res.status(400).json({ error: 'category and description are required' })
  const report: Report = {
    id: `VR-${reports.length + 1}`,
    category,
    description,
    submittedAt: new Date().toISOString(),
    status: 'RECEIVED',
  }
  reports.push(report)
  res.status(201).json(report)
})

// Only authorities can list/review reports.
router.get('/', optionalAuth, requireRole('AUTHORITY'), (_req: AuthedRequest, res) => {
  res.json(reports)
})

export default router
