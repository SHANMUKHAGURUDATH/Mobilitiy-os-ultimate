import { useState } from 'react'
import { Card, CardHeader, RiskBadge, PrimaryButton, StatusPill } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { generateIncidents } from '../data/urban'
import { Camera } from 'lucide-react'
import type { IncidentType } from '../types'

const TYPES: IncidentType[] = ['POTHOLE', 'FLOODING', 'SIGNAL_FAULT', 'FALLEN_TREE', 'BLOCKAGE', 'CONSTRUCTION', 'ACCIDENT', 'OTHER']

export default function RoadReports() {
  const [incidents, setIncidents] = useState(() => generateIncidents(30))
  const [type, setType] = useState<IncidentType>('POTHOLE')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function submit() {
    if (!desc.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      setIncidents((prev) => [
        { id: `INC-${prev.length + 1}`, type, position: { lat: 18.1067, lng: 83.4014 }, severity: 'MEDIUM', description: desc, reportedAt: new Date().toISOString(), status: 'REPORTED' },
        ...prev,
      ])
      setDesc('')
      setSubmitting(false)
    }, 900)
  }

  const asRisk = (s: string) => (s === 'CRITICAL' || s === 'HIGH' || s === 'MEDIUM' || s === 'LOW' ? s : 'MEDIUM') as any

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Road Problem Detection</h1>

      <Card className="p-4">
        <CardHeader title="Report a hazard" />
        <div className="grid md:grid-cols-[auto_1fr_auto] gap-3 items-start mt-2">
          <select value={type} onChange={(e) => setType(e.target.value as IncidentType)} className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm">
            {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe what you saw…" className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm" />
          <PrimaryButton onClick={submit} className="inline-flex items-center gap-2"><Camera size={16} /> {submitting ? 'Classifying…' : 'Submit'}</PrimaryButton>
        </div>
        <p className="text-[11px] text-muted font-mono mt-2">Reports pass through a mock AI classifier for severity — replace with a real vision model when available.</p>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[460px] overflow-hidden">
          <div className="h-full p-3">
            <CityMap height="100%" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent Reports" />
          <div className="px-4 pb-4 space-y-2 max-h-[400px] overflow-y-auto">
            {incidents.slice(0, 15).map((i) => (
              <div key={i.id} className="p-3 rounded-md border border-grid text-xs">
                <div className="flex justify-between mb-1">
                  <span>{i.type.replace('_', ' ')}</span>
                  <RiskBadge level={asRisk(i.severity)} />
                </div>
                <div className="text-muted mb-1">{i.description}</div>
                <StatusPill tone={i.status === 'RESOLVED' ? 'signal' : i.status === 'CONFIRMED' ? 'amber' : 'muted'}>{i.status}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
