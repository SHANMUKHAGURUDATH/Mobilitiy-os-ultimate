import { useMemo } from 'react'
import { Card, CardHeader, StatusPill } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { generateParking } from '../data/urban'

const TONE = { LOW: 'signal', MODERATE: 'amber', HIGH: 'red' } as const

export default function Parking() {
  const spots = useMemo(() => generateParking(20), [])

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Smart Parking</h1>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 h-[500px] overflow-hidden">
          <div className="h-full p-3">
            <CityMap parking={spots} height="100%" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Nearby Lots" sub="AI-predicted availability (simulated)" />
          <div className="px-4 pb-4 space-y-2 max-h-[440px] overflow-y-auto">
            {spots.map((p) => (
              <div key={p.id} className="p-3 rounded-md border border-grid text-xs">
                <div className="flex justify-between mb-1">
                  <span>{p.name}</span>
                  <StatusPill tone={TONE[p.congestion]}>{p.congestion}</StatusPill>
                </div>
                <div className="font-mono text-muted">{p.availableSlots}/{p.totalSlots} free · ₹{p.pricePerHour ?? 0}/hr</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
