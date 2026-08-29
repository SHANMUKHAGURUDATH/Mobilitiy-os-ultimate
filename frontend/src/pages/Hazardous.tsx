import { useMemo } from 'react'
import { Card, CardHeader, StatusPill, EmptyState } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { useFleet } from '../lib/useFleet'
import { useAuth } from '../context/AuthContext'
import { Lock } from 'lucide-react'

export default function Hazardous() {
  const { fleet } = useFleet()
  const { can } = useAuth()
  const hazVehicles = useMemo(() => fleet.filter((v) => v.category === 'HAZMAT'), [fleet])

  const authorized = can(['AUTHORITY', 'TRANSPORT_OPERATOR', 'SUPER_ADMIN'])

  if (!authorized) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-xl font-semibold">Hazardous Vehicle Intelligence</h1>
        <EmptyState
          title="Restricted module"
          description="This module is limited to authorized transport, government and emergency roles. Switch role from the header to preview it in this demo."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock size={16} className="text-amber" />
        <h1 className="font-display text-xl font-semibold">Hazardous Vehicle Intelligence</h1>
      </div>
      <p className="text-xs text-muted font-mono">Material type, quantity, owner and driver identity are withheld even from this authorized view in the prototype — a full deployment would gate those fields per-role at the API layer.</p>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[460px] overflow-hidden">
          <div className="h-full p-3">
            <CityMap vehicles={hazVehicles} height="100%" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Monitored Vehicles" />
          <div className="px-4 pb-4 space-y-2 max-h-[400px] overflow-y-auto">
            {hazVehicles.map((v) => (
              <div key={v.id} className="p-3 rounded-md border border-grid text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-amber">{v.id}</span>
                  <StatusPill tone={v.status === 'ON_ROUTE' ? 'signal' : 'amber'}>{v.status}</StatusPill>
                </div>
                <div className="text-muted">Route {v.routeId} · Speed {v.speedKmh} km/h</div>
                <div className="text-muted">No restricted-zone deviation detected</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
