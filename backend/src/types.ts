export type Role = 'SUPER_ADMIN' | 'AUTHORITY' | 'TRANSPORT_OPERATOR' | 'DRIVER' | 'CITIZEN' | 'ANALYST'

export type VehicleCategory =
  | 'RTC_BUS' | 'COLLEGE_BUS' | 'PRIVATE_BUS' | 'EMERGENCY' | 'HAZMAT'
  | 'TAXI' | 'AUTO' | 'TRUCK' | 'TWO_WHEELER' | 'OTHER'

export type VehicleStatus = 'ON_ROUTE' | 'DELAYED' | 'STOPPED' | 'OFFLINE'
export type ConnectionStatus = 'LIVE' | 'STALE' | 'OFFLINE'

export interface LatLng {
  lat: number
  lng: number
}

// Legacy shape kept for the WebSocket SIMULATION-mode stream only
// (backend/src/data/fleet.ts + ws/simulation.ts). Real vehicles come from
// the `vehicles` table via routes/vehicles.ts.
export interface LiveVehicle {
  id: string
  category: VehicleCategory
  position: LatLng
  heading: number
  speedKmh: number
  status: VehicleStatus
  routeId?: string
  destination?: string
  etaMinutes?: number
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface RiskZone {
  id: string
  position: LatLng
  radiusMeters: number
  level: RiskLevel
  score: number
  factors: { label: string; weightPct: number }[]
}
