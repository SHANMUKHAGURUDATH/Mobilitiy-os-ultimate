import { Card, CardHeader, StatBlock, StatusPill } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { useFleet } from '../lib/useFleet'
import { useMemo } from 'react'
import { generateRiskZones, generateNotifications } from '../data/urban'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { fleet, connected } = useFleet()
  const { user } = useAuth()
  const riskZones = useMemo(() => generateRiskZones(24), [])
  const notifications = useMemo(() => generateNotifications(), [])

  const delayed = fleet.filter((v) => v.status === 'DELAYED').length
  const emergency = fleet.filter((v) => v.category === 'EMERGENCY').length
  const critical = riskZones.filter((z) => z.level === 'CRITICAL').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Welcome back, {user.name}</h1>
          <p className="text-sm text-muted mt-0.5">Vizianagaram grid overview · role: <span className="font-mono">{user.role}</span></p>
        </div>
        <StatusPill tone={connected ? 'signal' : 'muted'}>{connected ? 'LIVE BACKEND' : 'LOCAL SIMULATION'}</StatusPill>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock label="Vehicles Tracked" value={fleet.length} tone="signal" />
        <StatBlock label="Delayed" value={delayed} tone="amber" />
        <StatBlock label="Emergency Active" value={emergency} tone="red" />
        <StatBlock label="Critical Risk Zones" value={critical} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader title="Live Vehicle & Risk Overview" sub="Anonymous IDs only — no driver, passenger or owner data is shown" />
          <div className="h-96 px-4 pb-4">
            <CityMap vehicles={fleet} riskZones={riskZones} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Notification Center" sub="Most recent alerts" />
          <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-2 text-xs border-b border-grid pb-2 last:border-0">
                <span>{n.icon}</span>
                <div>
                  <div className="text-text">{n.message}</div>
                  <div className="text-muted font-mono mt-0.5">{new Date(n.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
            <Link to="/dashboard/notifications" className="text-signal text-xs inline-block pt-1">View all →</Link>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Link to="/dashboard/navigation">
          <Card className="p-5 hover:border-signal/40 transition-colors h-full">
            <div className="font-display text-sm font-semibold mb-1">Plan a route</div>
            <div className="text-xs text-muted">Traffic-aware, hazard-avoiding navigation</div>
          </Card>
        </Link>
        <Link to="/dashboard/emergency">
          <Card className="p-5 hover:border-signal/40 transition-colors h-full">
            <div className="font-display text-sm font-semibold mb-1">Raise SOS</div>
            <div className="text-xs text-muted">One-tap emergency dispatch simulation</div>
          </Card>
        </Link>
        <Link to="/dashboard/digital-twin">
          <Card className="p-5 hover:border-signal/40 transition-colors h-full">
            <div className="font-display text-sm font-semibold mb-1">Run a what-if</div>
            <div className="text-xs text-muted">Simulate a road closure or surge in traffic</div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
