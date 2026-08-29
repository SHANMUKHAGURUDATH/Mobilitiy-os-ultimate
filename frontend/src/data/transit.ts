import type { TransitRoute, PersonalVehicle, VehicleDocument } from '../types'
import { CITY_CENTER, jitterLatLng, randRange } from './city'

const STOP_NAMES = ['Fort Circle', 'Railway Station', 'RTC Complex', 'College Junction', 'District Hospital', 'Balaji Nagar', 'Cantonment', 'Industrial Estate']

function buildRoute(id: string, name: string, operator: TransitRoute['operator']): TransitRoute {
  const stopCount = Math.floor(randRange(4, 7))
  const stops = Array.from({ length: stopCount }, (_, i) => ({
    id: `${id}-S${i + 1}`,
    name: STOP_NAMES[i % STOP_NAMES.length],
    position: jitterLatLng(CITY_CENTER, 5),
  }))
  return {
    id,
    name,
    operator,
    stops,
    path: stops.map((s) => s.position),
    serviceStatus: Math.random() > 0.85 ? 'DELAYED' : 'NORMAL',
  }
}

export function generateRoutes(): TransitRoute[] {
  const routes: TransitRoute[] = []
  for (let i = 1; i <= 6; i++) routes.push(buildRoute(`RTC-R${i}`, `RTC Route ${i}`, 'RTC'))
  for (let i = 1; i <= 4; i++) routes.push(buildRoute(`CLG-R${i}`, `College Shuttle ${i}`, 'COLLEGE'))
  for (let i = 1; i <= 3; i++) routes.push(buildRoute(`PVT-R${i}`, `Private Line ${i}`, 'PRIVATE'))
  return routes
}

export function generatePersonalVehicles(): PersonalVehicle[] {
  return [
    {
      id: 'PV-1',
      type: 'BIKE',
      registrationNumber: 'AP-31-BX-4521',
      manufacturer: 'Honda',
      model: 'Shine',
      year: 2022,
      fuelType: 'PETROL',
      insuranceExpiry: '2027-03-14',
      pucExpiry: '2026-11-02',
      maintenanceScore: 82,
    },
    {
      id: 'PV-2',
      type: 'CAR',
      registrationNumber: 'AP-31-CD-9087',
      manufacturer: 'Maruti Suzuki',
      model: 'Swift',
      year: 2020,
      fuelType: 'PETROL',
      insuranceExpiry: '2026-09-09',
      pucExpiry: '2026-09-20',
      maintenanceScore: 68,
    },
  ]
}

export function generateDocuments(): VehicleDocument[] {
  return [
    { id: 'D-1', kind: 'RC', vehicleId: 'PV-1', status: 'VALID', extractedFields: { owner: 'On file', class: 'Two-wheeler (non-transport)' } },
    { id: 'D-2', kind: 'INSURANCE', vehicleId: 'PV-1', status: 'VALID', expiryDate: '2027-03-14' },
    { id: 'D-3', kind: 'PUC', vehicleId: 'PV-1', status: 'EXPIRING_SOON', expiryDate: '2026-11-02' },
    { id: 'D-4', kind: 'LICENCE', vehicleId: 'PV-1', status: 'VALID', expiryDate: '2031-01-01' },
    { id: 'D-5', kind: 'INSURANCE', vehicleId: 'PV-2', status: 'EXPIRING_SOON', expiryDate: '2026-09-09' },
    { id: 'D-6', kind: 'PUC', vehicleId: 'PV-2', status: 'EXPIRED', expiryDate: '2026-08-01' },
  ]
}
