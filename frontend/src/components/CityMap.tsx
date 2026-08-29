import { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import type { LiveVehicle, RiskZone, LatLng, ParkingSpot, FuelStation } from '../types'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../data/vehicles'
import { CITY_CENTER, CITY_ZOOM } from '../data/city'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

const RISK_COLOR: Record<string, string> = {
  LOW: '#2dd4c8',
  MEDIUM: '#f5a623',
  HIGH: '#f5a623',
  CRITICAL: '#e5484d',
}

let loaderPromise: Promise<typeof google> | null = null
function loadGoogleMaps(): Promise<typeof google> {
  if (!API_KEY) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'))
  if (!loaderPromise) {
    setOptions({ key: API_KEY, v: 'weekly' })
    loaderPromise = Promise.all([importLibrary('maps'), importLibrary('marker')]).then(() => google)
  }
  return loaderPromise
}

/**
 * Real Google Maps basemap with vehicle/risk/parking/fuel markers. This
 * replaces the old Leaflet+CARTO CityMap (spec section 4) while keeping the
 * same prop shape so existing pages didn't need a rewrite — only the import.
 *
 * If VITE_GOOGLE_MAPS_API_KEY isn't set, this shows an explicit setup
 * notice instead of a blank/fake map (spec section 82).
 */
export function CityMap({
  vehicles = [],
  riskZones = [],
  parking = [],
  fuel = [],
  center,
  height = '100%',
  onVehicleClick,
}: {
  vehicles?: LiveVehicle[]
  riskZones?: RiskZone[]
  parking?: ParkingSpot[]
  fuel?: FuelStation[]
  route?: LatLng[] // kept for prop compatibility; use GoogleRouteMap for real routing
  center?: LatLng
  height?: string
  onVehicleClick?: (v: LiveVehicle) => void
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const overlaysRef = useRef<(google.maps.Circle | google.maps.marker.AdvancedMarkerElement)[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'not_configured'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!API_KEY) { setStatus('not_configured'); return }
    let cancelled = false
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !mapDivRef.current) return
        mapRef.current = new g.maps.Map(mapDivRef.current, {
          center: { lat: CITY_CENTER.lat, lng: CITY_CENTER.lng },
          zoom: CITY_ZOOM,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || undefined,
          disableDefaultUI: false,
        })
        setStatus('ready')
      })
      .catch((err) => { if (!cancelled) { setError(err.message); setStatus('error') } })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !center || !mapRef.current) return
    mapRef.current.panTo({ lat: center.lat, lng: center.lng })
  }, [center, status])

  // Vehicle markers (add/update/remove by id — avoids flicker on every tick)
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return
    const g = google
    const seen = new Set<string>()
    for (const v of vehicles) {
      seen.add(v.id)
      const color = CATEGORY_COLOR[v.category] || '#38bdf8'
      let marker = markersRef.current.get(v.id)
      const pin = document.createElement('div')
      pin.style.cssText = `width:12px;height:12px;border-radius:50%;background:${color};box-shadow:0 0 0 3px ${color}33,0 0 8px ${color}aa;border:1.5px solid #0a0f1a;cursor:pointer`
      if (!marker) {
        marker = new g.maps.marker.AdvancedMarkerElement({
          map: mapRef.current, position: { lat: v.position.lat, lng: v.position.lng }, content: pin,
          title: `${CATEGORY_LABEL[v.category] || v.category} — ${v.id}`,
        })
        marker.addListener('click', () => onVehicleClick?.(v))
        markersRef.current.set(v.id, marker)
      } else {
        marker.position = { lat: v.position.lat, lng: v.position.lng }
        marker.content = pin
      }
    }
    for (const [id, marker] of markersRef.current.entries()) {
      if (!seen.has(id)) { marker.map = null; markersRef.current.delete(id) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, status])

  // Risk zones / parking / fuel — redraw as simple overlays
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return
    const g = google
    overlaysRef.current.forEach((o) => { if (o instanceof g.maps.Circle) o.setMap(null); else o.map = null })
    overlaysRef.current = []

    for (const z of riskZones) {
      const circle = new g.maps.Circle({
        map: mapRef.current,
        center: { lat: z.position.lat, lng: z.position.lng },
        radius: z.radiusMeters,
        strokeColor: RISK_COLOR[z.level], fillColor: RISK_COLOR[z.level],
        strokeOpacity: 0.6, fillOpacity: 0.15, strokeWeight: 1,
      })
      overlaysRef.current.push(circle)
    }
    for (const p of parking) {
      const pin = document.createElement('div')
      pin.style.cssText = 'width:10px;height:10px;border-radius:2px;background:#38bdf8;border:1.5px solid #0a0f1a'
      const marker = new g.maps.marker.AdvancedMarkerElement({ map: mapRef.current, position: { lat: p.position.lat, lng: p.position.lng }, content: pin, title: p.name })
      overlaysRef.current.push(marker)
    }
    for (const f of fuel) {
      const pin = document.createElement('div')
      pin.style.cssText = 'width:10px;height:10px;border-radius:2px;background:#f5a623;border:1.5px solid #0a0f1a'
      const marker = new g.maps.marker.AdvancedMarkerElement({ map: mapRef.current, position: { lat: f.position.lat, lng: f.position.lng }, content: pin, title: f.name })
      overlaysRef.current.push(marker)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskZones, parking, fuel, status])

  if (status === 'not_configured') {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-lg border border-grid bg-surface-raised p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-sm font-semibold text-text">Google Maps is not configured</p>
          <p className="text-xs text-muted">
            Add <code className="text-signal">VITE_GOOGLE_MAPS_API_KEY</code> to frontend/.env and enable the Maps JavaScript API in Google Cloud Console.
          </p>
        </div>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-lg border border-red-500/40 bg-surface-raised p-6 text-center">
        <p className="text-xs text-red-400">{error}</p>
      </div>
    )
  }
  return (
    <div style={{ height, width: '100%' }} className="relative rounded-lg overflow-hidden border border-grid">
      <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/70 text-xs text-muted">Loading Google Maps…</div>
      )}
    </div>
  )
}
