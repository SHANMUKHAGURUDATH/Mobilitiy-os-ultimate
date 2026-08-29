// Core domain types shared across the platform.
// NOTE: all data flowing through these types in the prototype is DEMO / SIMULATED DATA
// unless explicitly wired to a real backend integration.

export type Role =
  | 'CITIZEN'
  | 'DRIVER'
  | 'TRANSPORT_OPERATOR'
  | 'AUTHORITY'
  | 'ANALYST'
  | 'SUPER_ADMIN'

export type VehicleCategory =
  | 'COLLEGE_BUS'
  | 'RTC_BUS'
  | 'PRIVATE_BUS'
  | 'EMERGENCY'
  | 'HAZMAT'
  | 'AUTHORIZED_OTHER'

export type VehicleStatus = 'ON_ROUTE' | 'DELAYED' | 'STOPPED' | 'OFFLINE'

export interface LatLng {
  lat: number
  lng: number
}

// Public-facing vehicle record. Deliberately excludes any driver/passenger/owner PII.
export interface LiveVehicle {
  id: string // anonymous id e.g. "RTC-AP-102"
  category: VehicleCategory
  position: LatLng
  heading: number // degrees
  speedKmh: number
  status: VehicleStatus
  routeId?: string
  destination?: string
  etaMinutes?: number
}

export interface RouteStop {
  id: string
  name: string
  position: LatLng
}

export interface TransitRoute {
  id: string
  name: string
  operator: 'COLLEGE' | 'RTC' | 'PRIVATE'
  stops: RouteStop[]
  path: LatLng[]
  serviceStatus: 'NORMAL' | 'DELAYED' | 'DISRUPTED'
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface RiskZone {
  id: string
  position: LatLng
  radiusMeters: number
  level: RiskLevel
  score: number // 0-100
  factors: { label: string; weightPct: number }[]
}

export interface ParkingSpot {
  id: string
  name: string
  position: LatLng
  totalSlots: number
  availableSlots: number
  pricePerHour?: number
  congestion: 'LOW' | 'MODERATE' | 'HIGH'
}

export interface FuelStation {
  id: string
  name: string
  type: 'PETROL' | 'EV_CHARGING' | 'BOTH'
  position: LatLng
  fuelAvailable?: boolean
  evPortsFree?: number
  evPortsTotal?: number
}

export type IncidentType =
  | 'POTHOLE'
  | 'FLOODING'
  | 'SIGNAL_FAULT'
  | 'FALLEN_TREE'
  | 'BLOCKAGE'
  | 'CONSTRUCTION'
  | 'ACCIDENT'
  | 'OTHER'

export interface RoadIncident {
  id: string
  type: IncidentType
  position: LatLng
  severity: RiskLevel
  description: string
  reportedAt: string
  status: 'REPORTED' | 'VERIFYING' | 'CONFIRMED' | 'RESOLVED'
}

export interface PersonalVehicle {
  id: string
  type: 'BIKE' | 'CAR' | 'OTHER'
  registrationNumber: string
  manufacturer: string
  model: string
  year: number
  fuelType: 'PETROL' | 'DIESEL' | 'EV' | 'CNG' | 'HYBRID'
  insuranceExpiry: string
  pucExpiry: string
  maintenanceScore: number // 0-100
}

export type DocumentKind = 'RC' | 'INSURANCE' | 'PUC' | 'LICENCE' | 'PERMIT'

export interface VehicleDocument {
  id: string
  kind: DocumentKind
  vehicleId: string
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PROCESSING'
  expiryDate?: string
  extractedFields?: Record<string, string>
}

export type EmergencyType = 'ACCIDENT' | 'MEDICAL' | 'FIRE' | 'BREAKDOWN' | 'HAZARD' | 'OTHER'

export interface EmergencyAlert {
  id: string
  type: EmergencyType
  position: LatLng
  createdAt: string
  status: 'DISPATCHED' | 'EN_ROUTE' | 'RESOLVED'
}

export interface NotificationItem {
  id: string
  icon: string
  message: string
  level: 'INFO' | 'WARNING' | 'CRITICAL'
  createdAt: string
}

export interface VerificationReport {
  id: string
  category: 'SUSPICIOUS_VEHICLE' | 'SUSPICIOUS_DOCUMENT' | 'FRAUD' | 'REGISTRATION' | 'ROAD' | 'TRANSPORT'
  description: string
  submittedAt: string
  status: 'RECEIVED' | 'UNDER_REVIEW' | 'ANOMALY_FLAGGED' | 'CLOSED'
  aiNote?: string
}

export interface AuthUser {
  id: string
  name: string
  role: Role
}
