import type { LiveVehicle, VehicleCategory, VehicleStatus } from '../types'
import { jitterLatLng, pick, rand, randRange } from './city'

const CATEGORY_COUNTS: [VehicleCategory, number][] = [
  ['RTC_BUS', 10],
  ['COLLEGE_BUS', 6],
  ['PRIVATE_BUS', 4],
  ['EMERGENCY', 5],
  ['HAZMAT', 5],
  ['AUTHORIZED_OTHER', 5],
]

const STATUSES: VehicleStatus[] = ['ON_ROUTE', 'ON_ROUTE', 'ON_ROUTE', 'DELAYED', 'STOPPED']
const DESTINATIONS = ['Railway Station', 'RTC Complex', 'Fort Circle', 'College Junction', 'District Hospital', 'Industrial Estate', 'Balaji Nagar', 'Cantonment']

let counters: Record<string, number> = {}

function nextId(category: VehicleCategory): string {
  const prefix: Record<VehicleCategory, string> = {
    RTC_BUS: 'RTC-AP',
    COLLEGE_BUS: 'COLLEGE-BUS',
    PRIVATE_BUS: 'PVT-BUS',
    EMERGENCY: 'EMR-AMB',
    HAZMAT: 'HAZ-TNK',
    AUTHORIZED_OTHER: 'AUTH-VEH',
  }
  counters[category] = (counters[category] ?? 0) + 1
  return `${prefix[category]}-${String(counters[category]).padStart(2, '0')}`
}

export function generateFleet(): LiveVehicle[] {
  counters = {}
  const fleet: LiveVehicle[] = []
  for (const [category, count] of CATEGORY_COUNTS) {
    for (let i = 0; i < count; i++) {
      fleet.push({
        id: nextId(category),
        category,
        position: jitterLatLng(),
        heading: Math.floor(randRange(0, 359)),
        speedKmh: category === 'EMERGENCY' ? Math.floor(randRange(35, 65)) : Math.floor(randRange(10, 45)),
        status: category === 'EMERGENCY' ? 'ON_ROUTE' : pick(STATUSES),
        routeId: `RT-${Math.ceil(rand() * 12)}`,
        destination: pick(DESTINATIONS),
        etaMinutes: Math.floor(randRange(3, 40)),
      })
    }
  }
  return fleet
}

// advance every vehicle a small random step - simulates real-time GPS movement
export function stepFleet(fleet: LiveVehicle[]): LiveVehicle[] {
  return fleet.map((v) => {
    if (v.status === 'STOPPED' || v.status === 'OFFLINE') return v
    const headingRad = (v.heading * Math.PI) / 180
    const stepKm = (v.speedKmh / 3600) * 4 // ~4 seconds per tick
    const kmPerDegLat = 111
    const kmPerDegLng = 111 * Math.cos((v.position.lat * Math.PI) / 180)
    const newHeading = (v.heading + randRange(-8, 8) + 360) % 360
    return {
      ...v,
      heading: newHeading,
      position: {
        lat: v.position.lat + (Math.cos(headingRad) * stepKm) / kmPerDegLat,
        lng: v.position.lng + (Math.sin(headingRad) * stepKm) / kmPerDegLng,
      },
      etaMinutes: v.etaMinutes ? Math.max(0, v.etaMinutes - (rand() > 0.7 ? 1 : 0)) : v.etaMinutes,
    }
  })
}

export const CATEGORY_LABEL: Record<VehicleCategory, string> = {
  RTC_BUS: 'RTC Bus',
  COLLEGE_BUS: 'College Bus',
  PRIVATE_BUS: 'Private Bus',
  EMERGENCY: 'Emergency Vehicle',
  HAZMAT: 'Hazardous Material Vehicle',
  AUTHORIZED_OTHER: 'Authorized Vehicle',
}

export const CATEGORY_COLOR: Record<VehicleCategory, string> = {
  RTC_BUS: '#2dd4c8',
  COLLEGE_BUS: '#60a5fa',
  PRIVATE_BUS: '#a78bfa',
  EMERGENCY: '#e5484d',
  HAZMAT: '#f5a623',
  AUTHORIZED_OTHER: '#7c8aa3',
}
