import { useMemo, useState } from 'react'
import { CityMap } from '../components/CityMap'
import { Card, CardHeader, StatusPill } from '../components/ui'
import { useLiveVehicles } from '../hooks/useLiveVehicles'
import { useMode } from '../context/ModeContext'
import { CATEGORY_LABEL, CATEGORY_COLOR } from '../data/vehicles'
import type { VehicleCategory } from '../types'
import type { VehicleDTO } from '../lib/api'

const CATEGORIES = Object.keys(CATEGORY_LABEL) as VehicleCategory[]

export default function LiveMap() {
  const { vehicles, connected, loading, error } = useLiveVehicles()
  const { mode } = useMode()
  const [active, setActive] = useState<VehicleCategory[]>(CATEGORIES)
  const [selected, setSelected] = useState<VehicleDTO | null>(null)

  const filtered = useMemo(() => vehicles.filter((v) => active.includes(v.category as VehicleCategory)), [vehicles, active])
  const asLiveVehicles = filtered.filter((v) => v.position).map((v) => ({
    id: v.registrationNumber, category: v.category as VehicleCategory, position: v.position!,
    heading: v.heading || 0, speedKmh: v.speedKmh || 0, status: v.status as any,
  }))

  function toggle(cat: VehicleCategory) {
    setActive((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Live Vehicle Intelligence</h1>
        <div className="flex gap-2">
          <StatusPill tone={mode === 'SIMULATION' ? 'amber' : connected ? 'signal' : 'muted'}>
            {mode === 'SIMULATION' ? 'SIMULATION MODE' : connected ? 'LIVE — CONNECTED' : 'LIVE — DISCONNECTED'}
          </StatusPill>
        </div>
      </div>
      {error && <Card className="p-3 border-red-500/40 text-red-400 text-xs">Could not reach backend: {error}. Is it running on VITE_API_BASE?</Card>}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors flex items-center gap-2 ${
              active.includes(c) ? 'border-signal/50 text-text bg-surface-raised' : 'border-grid text-muted'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLOR[c] }} />
            {CATEGORY_LABEL[c]}
            <span className="text-muted">({vehicles.filter((v) => v.category === c).length})</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[560px] overflow-hidden">
          <div className="h-full p-3">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted">Loading vehicles…</div>
            ) : (
              <CityMap
                vehicles={asLiveVehicles}
                onVehicleClick={(v) => setSelected(filtered.find((f) => f.registrationNumber === v.id) || null)}
                height="100%"
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Vehicle Detail" sub={mode === 'SIMULATION' ? 'Simulated demo data' : 'Live position from real GPS ingest'} />
          <div className="px-4 pb-4">
            {selected ? (
              <div className="space-y-2 text-sm">
                <div className="font-mono text-signal">{selected.registrationNumber}</div>
                <div className="text-muted text-xs">{CATEGORY_LABEL[selected.category as VehicleCategory]}</div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="text-muted">Status</div><div>{selected.status}</div>
                  <div className="text-muted">Connection</div><div>{selected.connectionStatus}</div>
                  <div className="text-muted">Speed</div><div>{selected.speedKmh ?? '—'} km/h</div>
                  <div className="text-muted">Heading</div><div>{selected.heading ?? '—'}°</div>
                  <div className="text-muted">Last update</div><div>{selected.lastUpdateAt ? new Date(selected.lastUpdateAt).toLocaleTimeString() : 'never'}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">Click a marker on the map to see vehicle detail here. Vehicles with no GPS fix yet are not shown as markers — they legitimately have no position.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
