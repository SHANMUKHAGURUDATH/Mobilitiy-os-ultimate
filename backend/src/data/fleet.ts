import type { LiveVehicle, VehicleCategory, VehicleStatus, LatLng } from '../types'

// City anchor: Vizianagaram, Andhra Pradesh (demo only — swap for real GPS ingestion later)
export const CITY_CENTER: LatLng = { lat: 18.1067, lng: 83.4014 }

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function jitter(spreadKm = 4): LatLng {
  const kmPerDegLat = 111
  const kmPerDegLng = 111 * Math.cos((CITY_CENTER.lat * Math.PI) / 180)
  return {
    lat: CITY_CENTER.lat + rand(-spreadKm, spreadKm) / kmPerDegLat,
    lng: CITY_CENTER.lng + rand(-spreadKm, spreadKm) / kmPerDegLng,
  }
}

const CATEGORY_COUNTS: [VehicleCategory, number][] = [
  ['RTC_BUS', 10],
  ['COLLEGE_BUS', 6],
  ['PRIVATE_BUS', 4],
  ['EMERGENCY', 5],
  ['HAZMAT', 5],
  ['OTHER', 5],
]

const PREFIX: Record<VehicleCategory, string> = {
  RTC_BUS: 'RTC-AP',
  COLLEGE_BUS: 'COLLEGE-BUS',
  PRIVATE_BUS: 'PVT-BUS',
  EMERGENCY: 'EMR-AMB',
  HAZMAT: 'HAZ-TNK',
  TAXI: 'TAXI',
  AUTO: 'AUTO',
  TRUCK: 'TRUCK',
  TWO_WHEELER: 'TW',
  OTHER: 'AUTH-VEH',
}

const STATUSES: VehicleStatus[] = ['ON_ROUTE', 'ON_ROUTE', 'ON_ROUTE', 'DELAYED', 'STOPPED']
const DESTINATIONS = ['Railway Station', 'RTC Complex', 'Fort Circle', 'College Junction', 'District Hospital', 'Industrial Estate']

export function generateFleet(): LiveVehicle[] {
  const fleet: LiveVehicle[] = []
  for (const [category, count] of CATEGORY_COUNTS) {
    for (let i = 0; i < count; i++) {
      fleet.push({
        id: `${PREFIX[category]}-${String(i + 1).padStart(2, '0')}`,
        category,
        position: jitter(),
        heading: Math.floor(rand(0, 359)),
        speedKmh: category === 'EMERGENCY' ? Math.floor(rand(35, 65)) : Math.floor(rand(10, 45)),
        status: category === 'EMERGENCY' ? 'ON_ROUTE' : STATUSES[Math.floor(Math.random() * STATUSES.length)],
        routeId: `RT-${Math.ceil(Math.random() * 12)}`,
        destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
        etaMinutes: Math.floor(rand(3, 40)),
      })
    }
  }
  return fleet
}

export function stepFleet(fleet: LiveVehicle[]): LiveVehicle[] {
  return fleet.map((v) => {
    if (v.status === 'STOPPED' || v.status === 'OFFLINE') return v
    const headingRad = (v.heading * Math.PI) / 180
    const stepKm = (v.speedKmh / 3600) * 4
    const kmPerDegLat = 111
    const kmPerDegLng = 111 * Math.cos((v.position.lat * Math.PI) / 180)
    return {
      ...v,
      heading: (v.heading + rand(-8, 8) + 360) % 360,
      position: {
        lat: v.position.lat + (Math.cos(headingRad) * stepKm) / kmPerDegLat,
        lng: v.position.lng + (Math.sin(headingRad) * stepKm) / kmPerDegLng,
      },
      etaMinutes: v.etaMinutes ? Math.max(0, v.etaMinutes - (Math.random() > 0.7 ? 1 : 0)) : v.etaMinutes,
    }
  })
}
