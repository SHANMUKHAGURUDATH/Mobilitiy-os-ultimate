import { useMemo } from 'react'
import { Card } from '../components/ui'
import { generateNotifications } from '../data/urban'

const LEVEL_BORDER = { INFO: 'border-grid', WARNING: 'border-amber/40', CRITICAL: 'border-red/40' } as const

export default function Notifications() {
  const notifications = useMemo(() => generateNotifications(), [])

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="font-display text-xl font-semibold">Notification Center</h1>
      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={`p-3.5 border ${LEVEL_BORDER[n.level]}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">{n.icon}</span>
              <div className="flex-1">
                <div className="text-sm">{n.message}</div>
                <div className="text-[11px] text-muted font-mono mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
