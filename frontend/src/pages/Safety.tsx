import { useMemo, useState } from 'react'
import { Card, CardHeader, RiskBadge } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { generateRiskZones } from '../data/urban'
import type { RiskZone } from '../types'

export default function Safety() {
  const zones = useMemo(() => generateRiskZones(24), [])
  const [selected, setSelected] = useState<RiskZone | null>(zones[0] ?? null)

  const counts = {
    LOW: zones.filter((z) => z.level === 'LOW').length,
    MEDIUM: zones.filter((z) => z.level === 'MEDIUM').length,
    HIGH: zones.filter((z) => z.level === 'HIGH').length,
    CRITICAL: zones.filter((z) => z.level === 'CRITICAL').length,
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold">AI Accident-Risk Prediction</h1>
        <p className="text-xs text-muted font-mono mt-1">DEMO rule-based prediction engine — not validated against real-world outcomes. Swap in a trained model via the same scoring interface.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((lvl) => (
          <Card key={lvl} className="p-3 text-center">
            <RiskBadge level={lvl} />
            <div className="font-mono text-2xl mt-2">{counts[lvl]}</div>
            <div className="text-[10px] text-muted uppercase">zones</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[500px] overflow-hidden">
          <div className="h-full p-3">
            <CityMap riskZones={zones} height="100%" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Zone list" />
          <div className="px-4 pb-4 space-y-2 max-h-[440px] overflow-y-auto">
            {zones.sort((a, b) => b.score - a.score).map((z) => (
              <button
                key={z.id}
                onClick={() => setSelected(z)}
                className={`w-full text-left p-3 rounded-md border text-xs transition-colors ${selected?.id === z.id ? 'border-signal/50 bg-surface-raised' : 'border-grid hover:border-signal/30'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-muted">{z.id}</span>
                  <RiskBadge level={z.level} />
                </div>
                <div className="font-mono">Score: {z.score}/100</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {selected && (
        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold mb-3">Why {selected.id} is rated {selected.level}</h3>
          <div className="space-y-2">
            {selected.factors.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-40 text-xs text-muted">{f.label}</div>
                <div className="flex-1 h-2 bg-grid rounded-full overflow-hidden">
                  <div className="h-full bg-signal" style={{ width: `${f.weightPct}%` }} />
                </div>
                <div className="w-10 text-xs font-mono text-right">{f.weightPct}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
