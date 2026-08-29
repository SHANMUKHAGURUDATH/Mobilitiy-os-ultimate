import { useEffect, useRef, useState } from 'react'
import type { LiveVehicle } from '../types'
import { generateFleet, stepFleet } from '../data/vehicles'
import { API_BASE, VehiclesApi, type VehicleDTO } from './api'

function dtoToLiveVehicle(v: VehicleDTO): LiveVehicle {
  return {
    id: v.id,
    category: v.category as LiveVehicle['category'],
    position: v.position ?? { lat: 0, lng: 0 },
    heading: v.heading ?? 0,
    speedKmh: v.speedKmh ?? 0,
    status: (v.status as LiveVehicle['status']) ?? 'OFFLINE',
    routeId: v.routeName,
  }
}

/**
 * Tries the REAL backend first (GET /api/vehicles + the /ws/live channel,
 * which only ever broadcasts events triggered by a real POST to
 * /api/vehicles/:id/location — see backend/src/ws/live.ts).
 *
 * Only if the backend can't be reached at all does this fall back to a
 * fully local, in-browser demo so the UI stays usable — and that fallback
 * is always reported truthfully via `connected: false`, which every page
 * using this hook renders as "LOCAL SIMULATION" rather than "LIVE BACKEND".
 * It is never presented as real data.
 */
export function useFleet() {
  const [fleet, setFleet] = useState<LiveVehicle[]>(() => generateFleet())
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let fallbackInterval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    VehiclesApi.list()
      .then((data) => {
        if (cancelled) return
        setFleet(data.map(dtoToLiveVehicle))
        setConnected(true)
        const ws = new WebSocket(API_BASE.replace(/^http/, 'ws') + '/ws/live')
        wsRef.current = ws
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            if (msg.type === 'vehicle_location') {
              const updated = dtoToLiveVehicle(msg.payload)
              setFleet((prev) => {
                const idx = prev.findIndex((v) => v.id === updated.id)
                if (idx === -1) return [...prev, updated]
                const next = [...prev]
                next[idx] = updated
                return next
              })
            }
          } catch {
            /* ignore malformed frame */
          }
        }
        ws.onerror = () => setConnected(false)
        ws.onclose = () => setConnected(false)
      })
      .catch(() => {
        // Backend unreachable — explicit, labeled local fallback only.
        setConnected(false)
        fallbackInterval = setInterval(() => {
          setFleet((prev) => stepFleet(prev))
        }, 2500)
      })

    return () => {
      cancelled = true
      wsRef.current?.close()
      if (fallbackInterval) clearInterval(fallbackInterval)
    }
  }, [])

  return { fleet, connected }
}
