import { useState } from 'react'
import { Card, CardHeader, GhostButton, StatusPill } from '../components/ui'
import { CityMap } from '../components/CityMap'
import { jitterLatLng, CITY_CENTER } from '../data/city'
import { Siren, AlertTriangle } from 'lucide-react'
import type { EmergencyType } from '../types'

const TYPES: EmergencyType[] = ['ACCIDENT', 'MEDICAL', 'FIRE', 'BREAKDOWN', 'HAZARD', 'OTHER']

export default function Emergency() {
  const [dispatched, setDispatched] = useState<{ type: EmergencyType; position: ReturnType<typeof jitterLatLng> } | null>(null)
  const [bikerAlertVisible, setBikerAlertVisible] = useState(false)

  function raiseSOS(type: EmergencyType) {
    setDispatched({ type, position: jitterLatLng(CITY_CENTER, 2) })
  }

  function simulateAmbulanceAlert() {
    setBikerAlertVisible(true)
    setTimeout(() => setBikerAlertVisible(false), 6000)
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold">Emergency Response</h1>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5">
          <CardHeader title="One-Tap SOS" sub="Simulated dispatch — no real emergency service is contacted" />
          <div className="px-0 grid grid-cols-2 gap-2 mt-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => raiseSOS(t)}
                className="flex flex-col items-center gap-1 p-3 rounded-md border border-grid hover:border-red/50 hover:text-red transition-colors text-xs"
              >
                <Siren size={16} />
                {t}
              </button>
            ))}
          </div>

          {dispatched && (
            <div className="mt-4 p-3 rounded-md border border-red/30 bg-red/5 text-xs space-y-1">
              <div className="flex items-center gap-2 text-red font-medium"><AlertTriangle size={14} /> {dispatched.type} reported</div>
              <div className="text-muted">Nearest simulated responder identified. Route calculated. Trusted-contact notification simulated.</div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 h-[420px] overflow-hidden">
          <CardHeader title="Emergency Map" />
          <div className="h-[340px] px-4 pb-4">
            <CityMap
              center={dispatched?.position}
              vehicles={dispatched ? [{
                id: 'EMR-AMB-DEMO', category: 'EMERGENCY', position: dispatched.position, heading: 90,
                speedKmh: 48, status: 'ON_ROUTE', destination: 'District Hospital', etaMinutes: 6,
              }] : []}
              height="100%"
            />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold">Ambulance → Biker Proximity Alert</h3>
            <p className="text-xs text-muted mt-1 max-w-lg">
              When an authorized ambulance approaches, nearby connected road users are warned automatically — no patient or driver identity is ever shared.
            </p>
          </div>
          <GhostButton onClick={simulateAmbulanceAlert}>Simulate Approach</GhostButton>
        </div>
      </Card>

      {bikerAlertVisible && (
        <div className="fixed bottom-6 right-6 max-w-sm p-4 rounded-lg border border-red/40 bg-surface-raised shadow-2xl z-50">
          <div className="flex items-center gap-2 text-red font-medium text-sm mb-1">🚑 EMERGENCY VEHICLE APPROACHING</div>
          <p className="text-xs text-muted">An ambulance is approaching from behind. Please move safely when possible.</p>
          <StatusPill tone="red">SIMULATED ALERT</StatusPill>
        </div>
      )}
    </div>
  )
}
