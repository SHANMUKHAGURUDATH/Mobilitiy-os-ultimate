import { useEffect, useRef, useState } from 'react'
import { API_BASE, VehiclesApi, type VehicleDTO } from '../lib/api'
import type { LiveVehicle } from '../types'
import { generateFleet, stepFleet } from '../data/vehicles'
import { useMode } from '../context/ModeContext'

interface UseVehiclesResult {
  vehicles: VehicleDTO[]
  connected: boolean
  loading: boolean
  error: string | null
}

/**
 * LIVE mode: fetches real vehicles from GET /api/vehicles, then listens on
 * /ws/live for real vehicle_location broadcasts (only emitted when a real
 * GPS point is POSTed to /api/vehicles/:id/location). If nothing has ever
 * sent a real GPS point, the list legitimately has vehicles with
 * position: null — that's correct, not a bug, and the UI must render it as
 * "no live position yet", never invent one.
 *
 * SIMULATION mode: explicitly generates demo movement client-side, labeled
 * SIMULATION everywhere it's shown. It never runs unless the user has
 * switched to it via the mode toggle (see components/ModeToggle.tsx).
 */
export function useLiveVehicles(): UseVehiclesResult {
  const { mode } = useMode()
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    wsRef.current?.close()

    if (mode === 'SIMULATION') {
      // Explicit, labeled client-side demo data — never presented as LIVE.
      let fleet: LiveVehicle[] = generateFleet()
      const toDto = (v: LiveVehicle): VehicleDTO => ({
        id: v.id, registrationNumber: v.id, vehicleType: v.category, category: v.category,
        status: v.status, connectionStatus: 'LIVE', position: v.position, heading: v.heading,
        speedKmh: v.speedKmh, createdAt: '', updatedAt: '',
      })
      setVehicles(fleet.map(toDto))
      setConnected(true)
      setLoading(false)
      const interval = setInterval(() => {
        fleet = stepFleet(fleet)
        setVehicles(fleet.map(toDto))
      }, 2500)
      return () => clearInterval(interval)
    }

    // LIVE mode
    VehiclesApi.list()
      .then((data) => {
        if (cancelled) return
        setVehicles(data)
        setLoading(false)
        const ws = new WebSocket(API_BASE.replace(/^http/, 'ws') + '/ws/live')
        wsRef.current = ws
        ws.onopen = () => setConnected(true)
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            if (msg.type === 'vehicle_location') {
              setVehicles((prev) => {
                const idx = prev.findIndex((v) => v.id === msg.payload.id)
                if (idx === -1) return prev
                const next = [...prev]
                next[idx] = msg.payload
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
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Could not reach the backend at ' + API_BASE)
        setVehicles([])
        setConnected(false)
        setLoading(false)
      })

    return () => {
      cancelled = true
      wsRef.current?.close()
    }
  }, [mode])

  return { vehicles, connected, loading, error }
}
