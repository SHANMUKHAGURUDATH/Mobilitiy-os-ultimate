import { Card, CardHeader } from '../components/ui'
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const RULES: { role: string; access: string }[] = [
  { role: 'CITIZEN', access: 'Anonymous vehicle IDs, public routes, risk heatmap, parking/fuel availability' },
  { role: 'DRIVER', access: 'PUBLIC scope + own vehicle profile, own documents, own maintenance data' },
  { role: 'TRANSPORT_OPERATOR', access: 'DRIVER scope + fleet management, delays, route deviation for their fleet' },
  { role: 'AUTHORITY', access: 'Operational data across the city, verification reports, hazardous-vehicle monitoring' },
  { role: 'AUTHORITY', access: 'Emergency dispatch data, live ambulance/fire vehicle routing' },
  { role: 'SUPER_ADMIN', access: 'Full platform access — strictly controlled and audit-logged' },
]

const NEVER_EXPOSED = ['Phone numbers', 'Personal addresses', 'Passenger identities', 'Driver personal information', 'Private documents', 'Patient information', 'Sensitive cargo details', 'Private travel history']

export default function Privacy() {
  const { user } = useAuth()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Lock size={18} className="text-signal" />
        <h1 className="font-display text-xl font-semibold">Privacy & Security</h1>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2 text-signal text-sm font-medium"><ShieldCheck size={16} /> Privacy-by-design</div>
        <p className="text-xs text-muted max-w-2xl">
          Every module on this platform is built role-first: a user only ever receives the fields their role is authorized to see. You are currently viewing the platform as <span className="font-mono text-text">{user.role}</span>.
        </p>
      </Card>

      <Card>
        <CardHeader title="Role-based access matrix" />
        <div className="px-4 pb-4 space-y-2">
          {RULES.map((r) => (
            <div key={r.role} className="flex gap-4 text-xs p-2.5 rounded-md border border-grid">
              <div className="w-40 font-mono text-signal shrink-0">{r.role}</div>
              <div className="text-muted">{r.access}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3 text-red text-sm font-medium"><EyeOff size={16} /> Never exposed by this platform</div>
        <div className="grid md:grid-cols-2 gap-2">
          {NEVER_EXPOSED.map((n) => (
            <div key={n} className="flex items-center gap-2 text-xs text-muted"><Eye size={12} className="text-red/60" /> {n}</div>
          ))}
        </div>
      </Card>
    </div>
  )
}
