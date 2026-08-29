import { useMemo, useState } from 'react'
import { Card, CardHeader, StatusPill } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { generateRoutes } from '../data/transit'
import type { TransitRoute } from '../types'

const TABS: { key: TransitRoute['operator']; label: string }[] = [
  { key: 'RTC', label: 'RTC Buses' },
  { key: 'COLLEGE', label: 'College Buses' },
  { key: 'PRIVATE', label: 'Private Buses' },
]

export default function PublicTransport() {
  const routes = useMemo(() => generateRoutes(), [])
  const [tab, setTab] = useState<TransitRoute['operator']>('RTC')
  const [selected, setSelected] = useState<TransitRoute | null>(null)

  const filtered = routes.filter((r) => r.operator === tab)

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Public Transport Intelligence</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelected(null) }}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border ${tab === t.key ? 'border-signal/50 bg-surface-raised' : 'border-grid text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[500px] overflow-hidden">
          <div className="h-full p-3">
            <CityMap route={selected?.path} height="100%" />
          </div>
        </Card>

        <Card>
          <CardHeader title={`${tab} Routes`} sub="Live simulated ETAs & stop sequence" />
          <div className="px-4 pb-4 space-y-2 max-h-[440px] overflow-y-auto">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left p-3 rounded-md border text-xs transition-colors ${selected?.id === r.id ? 'border-signal/50 bg-surface-raised' : 'border-grid hover:border-signal/30'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-signal">{r.id}</span>
                  <StatusPill tone={r.serviceStatus === 'NORMAL' ? 'signal' : 'amber'}>{r.serviceStatus}</StatusPill>
                </div>
                <div className="text-text">{r.name}</div>
                <div className="text-muted mt-1">{r.stops.length} stops · {r.stops.map((s) => s.name).join(' → ')}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
