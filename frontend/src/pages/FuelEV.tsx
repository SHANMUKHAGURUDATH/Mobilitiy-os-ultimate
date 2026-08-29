import { useMemo } from 'react'
import { Card, CardHeader } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { generateFuelStations } from '../data/urban'

export default function FuelEV() {
  const stations = useMemo(() => generateFuelStations(20), [])

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Fuel & EV Intelligence</h1>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[500px] overflow-hidden">
          <div className="h-full p-3">
            <CityMap fuel={stations} height="100%" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Stations" sub="Availability shown where simulated data exists" />
          <div className="px-4 pb-4 space-y-2 max-h-[440px] overflow-y-auto">
            {stations.map((s) => (
              <div key={s.id} className="p-3 rounded-md border border-grid text-xs">
                <div className="mb-1">{s.name}</div>
                <div className="font-mono text-muted">
                  {s.type.replace('_', ' ')}
                  {s.evPortsTotal !== undefined && ` · EV ports ${s.evPortsFree}/${s.evPortsTotal} free`}
                  {s.fuelAvailable !== undefined && ` · Fuel ${s.fuelAvailable ? 'available' : 'unavailable'}`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
