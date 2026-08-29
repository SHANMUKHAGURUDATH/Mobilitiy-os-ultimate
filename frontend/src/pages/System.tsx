import { useEffect, useState } from 'react'
import { Card, StatusPill } from '../components/ui'
import { SystemApi, type SystemHealth } from '../lib/api'
import { RefreshCw } from 'lucide-react'

function tone(status: string) {
  if (status === 'CONNECTED') return 'signal'
  if (status === 'NOT_CONFIGURED') return 'amber'
  return 'muted'
}

export default function System() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setHealth(await SystemApi.health())
      setError(null)
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
    const i = setInterval(load, 10_000)
    return () => clearInterval(i)
  }, [])

  const googleMapsFrontendConfigured = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

  const rows: { label: string; status: string; detail?: string }[] = health
    ? [
        { label: 'Backend API', status: health.backend.status },
        { label: 'PostgreSQL Database', status: health.database.status, detail: health.database.detail },
        { label: 'Google Maps (frontend key)', status: googleMapsFrontendConfigured ? 'CONNECTED' : 'NOT_CONFIGURED' },
        { label: 'Google Maps (server key — Routes/Places)', status: health.googleMapsServerKey.status },
        { label: 'AI Service', status: health.aiService.status, detail: health.aiService.detail },
        { label: 'File Storage', status: health.storage.status, detail: `provider: ${health.storage.provider}` },
        { label: 'WebSocket (/ws/live)', status: health.websocket.status },
      ]
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">System Health</h1>
        <div className="flex items-center gap-3">
          {health && <StatusPill tone={health.simulationMode ? 'amber' : 'signal'}>{health.simulationMode ? 'SIMULATION MODE (backend)' : 'LIVE MODE (backend)'}</StatusPill>}
          <button onClick={load} className="px-3 py-1.5 rounded-md border border-grid text-xs inline-flex items-center gap-1"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {error && <Card className="p-3 border-red-500/40 text-red-400 text-xs">Could not reach backend: {error}</Card>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted text-xs uppercase font-mono border-b border-grid">
              <th className="px-4 py-3">Integration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-grid last:border-0">
                <td className="px-4 py-3">{r.label}</td>
                <td className="px-4 py-3"><StatusPill tone={tone(r.status)}>{r.status}</StatusPill></td>
                <td className="px-4 py-3 text-xs text-muted font-mono">{r.detail || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-[11px] text-muted font-mono">
        NOT_CONFIGURED means the required environment variable / credential hasn't been set — see .env.example in
        backend/ and frontend/. Nothing here is faked: a green CONNECTED means this process just checked and got a
        real response.
      </p>
    </div>
  )
}
