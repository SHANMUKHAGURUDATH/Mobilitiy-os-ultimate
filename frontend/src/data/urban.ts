import type {
  RiskZone, ParkingSpot, FuelStation, RoadIncident, NotificationItem,
  VerificationReport, IncidentType, RiskLevel,
} from '../types'
import { jitterLatLng, pick, rand, randRange } from './city'

function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 35) return 'MEDIUM'
  return 'LOW'
}

export function generateRiskZones(count = 24): RiskZone[] {
  const zones: RiskZone[] = []
  for (let i = 0; i < count; i++) {
    const traffic = randRange(0, 30)
    const accidentHistory = randRange(0, 30)
    const weather = randRange(0, 20)
    const roadCondition = randRange(0, 20)
    const score = Math.round(traffic + accidentHistory + weather + roadCondition)
    zones.push({
      id: `RZ-${i + 1}`,
      position: jitterLatLng(),
      radiusMeters: Math.round(randRange(250, 700)),
      level: levelFromScore(score),
      score,
      factors: [
        { label: 'Traffic density', weightPct: Math.round((traffic / score) * 100) || 30 },
        { label: 'Accident history', weightPct: Math.round((accidentHistory / score) * 100) || 30 },
        { label: 'Weather', weightPct: Math.round((weather / score) * 100) || 20 },
        { label: 'Road condition', weightPct: Math.round((roadCondition / score) * 100) || 20 },
      ],
    })
  }
  return zones
}

const PARKING_NAMES = ['Fort Circle Parking', 'Railway Station Lot', 'Junction Market Parking', 'Stadium Grounds', 'Bus Complex Parking', 'Mall Basement Parking']
export function generateParking(count = 20): ParkingSpot[] {
  return Array.from({ length: count }, (_, i) => {
    const total = Math.floor(randRange(20, 120))
    const available = Math.floor(randRange(0, total))
    const congestion = available / total < 0.15 ? 'HIGH' : available / total < 0.4 ? 'MODERATE' : 'LOW'
    return {
      id: `PK-${i + 1}`,
      name: `${pick(PARKING_NAMES)} ${i + 1}`,
      position: jitterLatLng(),
      totalSlots: total,
      availableSlots: available,
      pricePerHour: pick([0, 10, 20, 30]),
      congestion,
    }
  })
}

export function generateFuelStations(count = 20): FuelStation[] {
  return Array.from({ length: count }, (_, i) => {
    const type = pick(['PETROL', 'EV_CHARGING', 'BOTH'] as const)
    return {
      id: `FS-${i + 1}`,
      name: `${type === 'EV_CHARGING' ? 'EV Hub' : 'Fuel Station'} ${i + 1}`,
      type,
      position: jitterLatLng(),
      fuelAvailable: type !== 'EV_CHARGING' ? rand() > 0.15 : undefined,
      evPortsTotal: type !== 'PETROL' ? Math.floor(randRange(2, 8)) : undefined,
      evPortsFree: type !== 'PETROL' ? Math.floor(randRange(0, 4)) : undefined,
    }
  })
}

const INCIDENT_TYPES: IncidentType[] = ['POTHOLE', 'FLOODING', 'SIGNAL_FAULT', 'FALLEN_TREE', 'BLOCKAGE', 'CONSTRUCTION', 'ACCIDENT']
const INCIDENT_DESC: Record<IncidentType, string> = {
  POTHOLE: 'Deep pothole reported on carriageway',
  FLOODING: 'Waterlogging after rainfall',
  SIGNAL_FAULT: 'Traffic signal not functioning',
  FALLEN_TREE: 'Fallen tree obstructing lane',
  BLOCKAGE: 'Road blockage reported',
  CONSTRUCTION: 'Active construction zone',
  ACCIDENT: 'Minor collision reported',
  OTHER: 'Hazard reported',
}
export function generateIncidents(count = 30): RoadIncident[] {
  return Array.from({ length: count }, (_, i) => {
    const type = pick(INCIDENT_TYPES)
    return {
      id: `INC-${i + 1}`,
      type,
      position: jitterLatLng(),
      severity: pick(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const),
      description: INCIDENT_DESC[type],
      reportedAt: new Date(Date.now() - randRange(0, 1000 * 60 * 60 * 48)).toISOString(),
      status: pick(['REPORTED', 'VERIFYING', 'CONFIRMED', 'RESOLVED'] as const),
    }
  })
}

export function generateNotifications(): NotificationItem[] {
  const base: [string, string, NotificationItem['level']][] = [
    ['🚨', 'High accident risk detected ahead on NH-16', 'CRITICAL'],
    ['🚑', 'Ambulance approaching from behind — move left when safe', 'WARNING'],
    ['🌧️', 'Flood risk detected near Fort Circle underpass', 'WARNING'],
    ['🚌', 'RTC-AP-04 delayed by 8 minutes', 'INFO'],
    ['⚠️', 'Vehicle document expires in 15 days', 'WARNING'],
    ['🔧', 'Maintenance inspection recommended for AP-31-BX-4521', 'INFO'],
    ['🚧', 'Road blockage reported near Junction Market', 'INFO'],
  ]
  return base.map(([icon, message, level], i) => ({
    id: `N-${i + 1}`,
    icon,
    message,
    level,
    createdAt: new Date(Date.now() - i * 1000 * 60 * 14).toISOString(),
  }))
}

export function generateVerificationReports(): VerificationReport[] {
  return [
    {
      id: 'VR-1',
      category: 'SUSPICIOUS_VEHICLE',
      description: 'Vehicle observed with mismatched registration plate pattern',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      status: 'ANOMALY_FLAGGED',
      aiNote: 'Potential anomaly detected — requires official verification.',
    },
    {
      id: 'VR-2',
      category: 'ROAD',
      description: 'Repeated potholes near school zone',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      status: 'UNDER_REVIEW',
    },
    {
      id: 'VR-3',
      category: 'SUSPICIOUS_DOCUMENT',
      description: 'Insurance document formatting inconsistency flagged during OCR',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      status: 'ANOMALY_FLAGGED',
      aiNote: 'Potential anomaly detected — requires official verification.',
    },
  ]
}
