import { useRef, useState } from 'react'
import { Card, PrimaryButton, StatusPill } from '../components/ui'
import { GoogleRouteMap, type RouteSummary } from '../components/GoogleRouteMap'
import { Navigation2 } from 'lucide-react'

export default function Navigation() {
  const originRef = useRef<HTMLInputElement>(null)
  const destinationRef = useRef<HTMLInputElement>(null)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [pendingOrigin, setPendingOrigin] = useState('')
  const [pendingDestination, setPendingDestination] = useState('')
  const [routes, setRoutes] = useState<RouteSummary[]>([])
  const [selected, setSelected] = useState(0)
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'TWO_WHEELER' | 'WALKING' | 'BICYCLING'>('DRIVING')

  function planRoute() {
    setOrigin(pendingOrigin)
    setDestination(pendingDestination)
  }

  const fastest = routes.length ? [...routes].sort((a, b) => a.durationValue - b.durationValue)[0] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Navigation</h1>
        <StatusPill tone="signal">REAL GOOGLE ROAD ROUTING</StatusPill>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            ref={originRef}
            defaultValue={pendingOrigin}
            onChange={(e) => setPendingOrigin(e.target.value)}
            placeholder="From — e.g. ANITS, Vizianagaram"
            className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none focus:border-signal/60"
          />
          <input
            ref={destinationRef}
            defaultValue={pendingDestination}
            onChange={(e) => setPendingDestination(e.target.value)}
            placeholder="To — e.g. Visakhapatnam Railway Station"
            className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none focus:border-signal/60"
          />
          <PrimaryButton onClick={planRoute} className="inline-flex items-center gap-2">
            <Navigation2 size={16} /> Get Route
          </PrimaryButton>
        </div>
        <div className="flex gap-2 text-xs">
          {(['DRIVING', 'TWO_WHEELER', 'WALKING', 'BICYCLING'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setTravelMode(m)}
              className={`px-3 py-1 rounded-md border font-mono ${travelMode === m ? 'border-signal/60 text-text' : 'border-grid text-muted'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted font-mono">
          Routes are computed by the real Google Directions service and follow the actual road network — never a
          straight line across water or terrain. Requires VITE_GOOGLE_MAPS_API_KEY to be configured.
        </p>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[500px] overflow-hidden">
          <div className="h-full p-3">
            <GoogleRouteMap
              origin={origin}
              destination={destination}
              travelMode={travelMode}
              selectedRouteIndex={selected}
              onRoutesComputed={setRoutes}
              originInputRef={originRef}
              destinationInputRef={destinationRef}
              onOriginPlace={(p) => p.formatted_address && setPendingOrigin(p.formatted_address)}
              onDestinationPlace={(p) => p.formatted_address && setPendingDestination(p.formatted_address)}
              height="100%"
            />
          </div>
        </Card>

        <div className="space-y-3">
          {routes.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted">Enter a source and destination to get real driving directions and route alternatives.</p>
            </Card>
          )}
          {routes.map((r) => (
            <Card
              key={r.index}
              className={`p-4 cursor-pointer transition-colors ${selected === r.index ? 'border-signal/60' : ''}`}
              onClick={() => setSelected(r.index)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-display text-sm font-semibold">Route {r.index + 1}{r.summary ? ` — via ${r.summary}` : ''}</div>
                {fastest?.index === r.index && <StatusPill tone="signal">FASTEST</StatusPill>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div><div className="text-muted">Distance</div><div>{r.distanceText}</div></div>
                <div><div className="text-muted">ETA</div><div>{r.durationText}</div></div>
              </div>
              {r.warnings.length > 0 && <div className="text-[11px] text-amber-400 mt-2">{r.warnings.join(' ')}</div>}
            </Card>
          ))}
          {origin && destination && (
            <a
              className="block text-center text-xs font-mono text-signal underline"
              target="_blank" rel="noreferrer"
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode.toLowerCase()}`}
            >
              Open in Google Maps for turn-by-turn navigation →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
