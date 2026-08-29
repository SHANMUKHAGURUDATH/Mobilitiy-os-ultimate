import { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

export interface RouteSummary {
  index: number
  summary: string
  distanceText: string
  durationText: string
  durationValue: number
  distanceValue: number
  warnings: string[]
}

let loaderPromise: Promise<typeof google> | null = null
function loadGoogleMaps(): Promise<typeof google> {
  if (!API_KEY) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'))
  if (!loaderPromise) {
    setOptions({ key: API_KEY, v: 'weekly' })
    loaderPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('places'),
      importLibrary('routes'),
      importLibrary('geometry'),
    ]).then(() => google)
  }
  return loaderPromise
}

/**
 * Real Google Maps integration: JS API map, Places Autocomplete for the two
 * search boxes, and DirectionsService/DirectionsRenderer for actual
 * road-network routing (this is what guarantees routes follow real roads
 * and never cut across a lake — see spec section 7/75). If
 * VITE_GOOGLE_MAPS_API_KEY isn't set, this renders an explicit setup
 * instruction instead of a fake/blank map.
 */
export function GoogleRouteMap({
  origin, destination, travelMode = 'DRIVING',
  onRoutesComputed, selectedRouteIndex = 0,
  onOriginPlace, onDestinationPlace,
  originInputRef, destinationInputRef,
  height = '480px',
}: {
  origin: string
  destination: string
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TWO_WHEELER'
  onRoutesComputed?: (routes: RouteSummary[]) => void
  selectedRouteIndex?: number
  onOriginPlace?: (place: google.maps.places.PlaceResult) => void
  onDestinationPlace?: (place: google.maps.places.PlaceResult) => void
  originInputRef?: React.RefObject<HTMLInputElement | null>
  destinationInputRef?: React.RefObject<HTMLInputElement | null>
  height?: string
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'not_configured'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!API_KEY) {
      setStatus('not_configured')
      return
    }
    let cancelled = false
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !mapDivRef.current) return
        const map = new g.maps.Map(mapDivRef.current, {
          center: { lat: 18.1066, lng: 83.3956 }, // Vizianagaram — swap for your city center
          zoom: 13,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || undefined,
          disableDefaultUI: false,
        })
        mapRef.current = map
        const renderer = new g.maps.DirectionsRenderer({ map })
        directionsRendererRef.current = renderer

        if (originInputRef?.current) {
          const ac = new g.maps.places.Autocomplete(originInputRef.current)
          ac.addListener('place_changed', () => onOriginPlace?.(ac.getPlace()))
        }
        if (destinationInputRef?.current) {
          const ac = new g.maps.places.Autocomplete(destinationInputRef.current)
          ac.addListener('place_changed', () => onDestinationPlace?.(ac.getPlace()))
        }

        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !origin || !destination) return
    const g = (window as any).google as typeof google
    if (!g) return
    const service = new g.maps.DirectionsService()
    service.route(
      {
        origin,
        destination,
        travelMode: g.maps.TravelMode[travelMode],
        provideRouteAlternatives: true,
      },
      (result: google.maps.DirectionsResult | null, dirStatus: google.maps.DirectionsStatus | keyof typeof google.maps.DirectionsStatus) => {
        if (dirStatus === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result)
          directionsRendererRef.current?.setRouteIndex(selectedRouteIndex)
          const summaries: RouteSummary[] = result.routes.map((r: google.maps.DirectionsRoute, i: number) => ({
            index: i,
            summary: r.summary || `Route ${i + 1}`,
            distanceText: r.legs[0]?.distance?.text || '',
            durationText: r.legs[0]?.duration?.text || '',
            durationValue: r.legs[0]?.duration?.value || 0,
            distanceValue: r.legs[0]?.distance?.value || 0,
            warnings: r.warnings || [],
          }))
          onRoutesComputed?.(summaries)
          setError(null)
        } else {
          setError(`Directions request failed: ${dirStatus}`)
          onRoutesComputed?.([])
        }
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, origin, destination, travelMode])

  useEffect(() => {
    directionsRendererRef.current?.setRouteIndex(selectedRouteIndex)
  }, [selectedRouteIndex])

  if (status === 'not_configured') {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-lg border border-grid bg-surface-raised p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-sm font-semibold text-text">Google Maps is not configured</p>
          <p className="text-xs text-muted">
            Add <code className="text-signal">VITE_GOOGLE_MAPS_API_KEY</code> to frontend/.env, enable the
            Maps JavaScript API, Places API and Directions API in Google Cloud Console, then restart the dev server.
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
      {error && status === 'ready' && (
        <div className="absolute bottom-2 left-2 right-2 bg-surface-raised border border-red-500/40 rounded-md px-3 py-2 text-[11px] text-red-400">{error}</div>
      )}
    </div>
  )
}
