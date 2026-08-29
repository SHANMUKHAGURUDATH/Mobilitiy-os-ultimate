import { useMemo } from 'react'
import { Card, CardHeader, StatBlock, PrimaryButton } from '../components/ui'
import { generatePersonalVehicles } from '../data/transit'

export default function MyVehicles() {
  const vehicles = useMemo(() => generatePersonalVehicles(), [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">My Vehicles</h1>
        <PrimaryButton>+ Add Vehicle</PrimaryButton>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {vehicles.map((v) => (
          <Card key={v.id}>
            <CardHeader title={`${v.manufacturer} ${v.model}`} sub={`${v.type} · ${v.year} · ${v.fuelType}`} />
            <div className="px-4 pb-4 space-y-3">
              <div className="font-mono text-sm text-signal">{v.registrationNumber}</div>
              <div className="grid grid-cols-3 gap-2">
                <StatBlock label="Maintenance" value={v.maintenanceScore} unit="/100" tone={v.maintenanceScore > 75 ? 'signal' : v.maintenanceScore > 50 ? 'amber' : 'red'} />
                <StatBlock label="Insurance" value={v.insuranceExpiry.slice(0, 7)} />
                <StatBlock label="PUC" value={v.pucExpiry.slice(0, 7)} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-muted font-mono">Vehicle documents and RC/licence details are only visible to the signed-in owner (role-gated architecture, mock auth in this prototype).</p>
    </div>
  )
}
