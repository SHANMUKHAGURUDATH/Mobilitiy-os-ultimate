import { useState } from 'react'
import { Card, CardHeader, StatBlock, PrimaryButton, EmptyState } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { useAuth } from '../context/AuthContext'
import { Boxes } from 'lucide-react'

type Scenario = 'ROAD_CLOSURE' | 'TRAFFIC_SURGE' | 'FLOOD'

const SCENARIOS: { key: Scenario; label: string; desc: string }[] = [
  { key: 'ROAD_CLOSURE', label: 'Close a major road', desc: 'Simulates redistribution of traffic, bus and emergency routes' },
  { key: 'TRAFFIC_SURGE', label: 'Traffic +30%', desc: 'Simulates a sudden 30% rise in vehicle density' },
  { key: 'FLOOD', label: 'Flood a corridor', desc: 'Simulates a major road becoming impassable after rainfall' },
]

const RESULTS: Record<Scenario, { congestion: string; delay: string; affectedRoutes: string; note: string }> = {
  ROAD_CLOSURE: { congestion: '+42%', delay: '+11 min avg', affectedRoutes: '6 bus routes, 2 emergency corridors', note: 'Emergency routing automatically shifts to Ring Road bypass.' },
  TRAFFIC_SURGE: { congestion: '+30%', delay: '+6 min avg', affectedRoutes: '9 bus routes', note: 'Risk score rises in 4 zones due to increased density.' },
  FLOOD: { congestion: '+55%', delay: '+18 min avg', affectedRoutes: '3 bus routes, 1 emergency corridor', note: 'Affected zone re-flagged CRITICAL on the Safety Intelligence map.' },
}

export default function DigitalTwin() {
  const { can } = useAuth()
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [running, setRunning] = useState(false)

  const authorized = can(['AUTHORITY', 'TRANSPORT_OPERATOR', 'SUPER_ADMIN'])

  if (!authorized) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-xl font-semibold">Urban Digital Twin</h1>
        <EmptyState title="Authority-only module" description="Switch role from the header to preview the digital twin in this demo." />
      </div>
    )
  }

  function run(s: Scenario) {
    setScenario(s)
    setRunning(true)
    setTimeout(() => setRunning(false), 1200)
  }

  const result = scenario ? RESULTS[scenario] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Boxes size={18} className="text-signal" />
        <h1 className="font-display text-xl font-semibold">Urban Digital Twin</h1>
      </div>
      <p className="text-xs text-muted font-mono">What-if outcomes below are computed from simulated algorithms for this prototype, not a calibrated traffic model.</p>

      <div className="grid md:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => (
          <Card key={s.key} className="p-4">
            <div className="font-display text-sm font-semibold mb-1">{s.label}</div>
            <div className="text-xs text-muted mb-3">{s.desc}</div>
            <PrimaryButton onClick={() => run(s.key)} className="w-full">{running && scenario === s.key ? 'Simulating…' : 'Run Simulation'}</PrimaryButton>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[420px] overflow-hidden">
          <CardHeader title="City Grid" />
          <div className="h-[340px] px-4 pb-4">
            <CityMap height="100%" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Impact" />
          <div className="px-4 pb-4 space-y-3">
            {result ? (
              <>
                <StatBlock label="Congestion Change" value={result.congestion} tone="amber" />
                <StatBlock label="Avg Delay" value={result.delay} tone="amber" />
                <div className="text-xs text-muted">Affected: {result.affectedRoutes}</div>
                <div className="text-xs text-signal">{result.note}</div>
              </>
            ) : (
              <p className="text-xs text-muted">Run a scenario to see projected impact.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
