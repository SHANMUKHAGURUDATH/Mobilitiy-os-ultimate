import { Router } from 'express'
import { optionalAuth, requireRole, type AuthedRequest } from '../middleware/auth'
import { getSimulatedFleet } from '../ws/simulation'

const router = Router()

// NOTE: this endpoint still reads from the SIMULATION fleet generator, not
// the real `vehicles` table. Swap to a `SELECT * FROM vehicles WHERE
// category = 'HAZMAT'` query (same pattern as routes/vehicles.ts) once you
// have real HAZMAT vehicles registered in LIVE mode.
router.get('/', optionalAuth, requireRole('AUTHORITY', 'TRANSPORT_OPERATOR'), (_req: AuthedRequest, res) => {
  const hazmat = getSimulatedFleet()
    .filter((v) => v.category === 'HAZMAT')
    // Even for authorized roles, material type/quantity/owner/driver identity
    // are withheld in this prototype's data model — they simply do not exist
    // in LiveVehicle. A production system would gate those extra fields with
    // a stricter per-field ACL at the database/query layer.
    .map((v) => ({ ...v }))
  res.json(hazmat)
})

export default router
