import { useMemo } from 'react'
import { Card, CardHeader, StatusPill, EmptyState } from '../components/ui'
import { generateVerificationReports } from '../data/urban'
import { useAuth } from '../context/AuthContext'
import { Landmark } from 'lucide-react'

export default function Verification() {
  const reports = useMemo(() => generateVerificationReports(), [])
  const { can } = useAuth()
  const authorized = can(['AUTHORITY', 'SUPER_ADMIN'])

  if (!authorized) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-xl font-semibold">Government Verification</h1>
        <EmptyState title="Authority-only module" description="Switch to the Authority role from the header to preview this in the demo." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Landmark size={18} className="text-signal" />
        <h1 className="font-display text-xl font-semibold">Government Verification & Fraud Intelligence</h1>
      </div>
      <p className="text-xs text-muted font-mono max-w-2xl">
        This module runs against a mock verification service in the prototype — no real government database is queried. AI flags are phrased as anomalies requiring official review, never as accusations.
      </p>

      <Card>
        <CardHeader title="Submitted Reports" />
        <div className="px-4 pb-4 space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="p-3 rounded-md border border-grid text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-xs text-muted">{r.category.replace('_', ' ')}</span>
                <StatusPill tone={r.status === 'ANOMALY_FLAGGED' ? 'amber' : r.status === 'CLOSED' ? 'signal' : 'muted'}>{r.status.replace('_', ' ')}</StatusPill>
              </div>
              <div>{r.description}</div>
              {r.aiNote && <div className="text-xs text-amber mt-1.5">⚠ {r.aiNote}</div>}
              <div className="text-[11px] text-muted font-mono mt-1">{new Date(r.submittedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
