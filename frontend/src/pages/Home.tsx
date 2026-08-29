import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Navigation2, Truck, Siren, Boxes, Lock, ArrowRight, Radar } from 'lucide-react'

const CAPABILITIES = [
  { icon: ShieldAlert, title: 'AI Safety Intelligence', desc: 'Rule-based risk scoring across traffic, weather, road condition and accident history, rendered as a live heatmap.' },
  { icon: Navigation2, title: 'Smart Mobility', desc: 'Traffic-aware routing with hazard avoidance and emergency route optimization on open map data.' },
  { icon: Truck, title: 'Vehicle Intelligence', desc: 'Live tracking of buses, private fleets, emergency and hazardous-material vehicles by anonymous ID.' },
  { icon: Siren, title: 'Emergency Response', desc: 'One-tap SOS and proximity-based ambulance alerts that warn nearby road users in real time.' },
  { icon: Boxes, title: 'Urban Digital Twin', desc: 'City-scale what-if simulation — close a road, spike traffic, flood a corridor — and see the impact.' },
  { icon: Lock, title: 'Privacy-first Architecture', desc: 'Role-based access control ensures each user sees only what they are authorized to see.' },
]

const PIPELINE = ['Detect', 'Understand', 'Predict', 'Warn', 'Optimize', 'Resolve']

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-ink text-text font-sans">
      {/* NAV */}
      <header className="border-b border-grid">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Radar className="text-signal" size={22} />
            <span className="font-display font-semibold tracking-tight">MOBILITY OS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
            <span>Modules</span>
            <span>Safety</span>
            <span>Government</span>
            <span>Privacy</span>
          </nav>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-md bg-signal text-ink text-sm font-medium hover:bg-signal-dim transition-colors"
          >
            Open Dashboard
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="overflow-hidden mb-6 border-y border-grid py-2">
            <div className="ticker-track flex whitespace-nowrap font-mono text-xs text-signal">
              {[...PIPELINE, ...PIPELINE].map((p, i) => (
                <span key={i} className="mx-4 flex items-center gap-4">
                  {p.toUpperCase()} <span className="text-grid">→</span>
                </span>
              ))}
            </div>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
            Intelligence for every journey.
          </h1>
          <p className="mt-5 text-muted text-lg max-w-md">
            One platform unifying vehicles, mobility and urban safety — built to detect risk before it becomes an incident.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => navigate('/dashboard/live-map')} className="px-5 py-2.5 rounded-md bg-signal text-ink text-sm font-medium hover:bg-signal-dim transition-colors inline-flex items-center gap-2">
              Explore Live Mobility <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/dashboard/navigation')} className="px-5 py-2.5 rounded-md border border-grid text-sm font-medium hover:border-signal/50 hover:text-signal transition-colors">
              Plan a Route
            </button>
            <button onClick={() => navigate('/dashboard/safety')} className="px-5 py-2.5 rounded-md border border-grid text-sm font-medium hover:border-signal/50 hover:text-signal transition-colors">
              Check Safety
            </button>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md font-mono">
            <div>
              <div className="text-2xl text-signal font-semibold">35</div>
              <div className="text-[11px] text-muted uppercase tracking-wide mt-1">Vehicles tracked</div>
            </div>
            <div>
              <div className="text-2xl text-amber font-semibold">24</div>
              <div className="text-[11px] text-muted uppercase tracking-wide mt-1">Risk zones live</div>
            </div>
            <div>
              <div className="text-2xl text-text font-semibold">4s</div>
              <div className="text-[11px] text-muted uppercase tracking-wide mt-1">Update interval</div>
            </div>
          </div>
        </div>

        {/* SIGNATURE: radar-sweep live panel */}
        <div className="relative aspect-square max-w-md mx-auto w-full">
          <div className="absolute inset-0 rounded-full border border-grid" />
          <div className="absolute inset-8 rounded-full border border-grid" />
          <div className="absolute inset-16 rounded-full border border-grid" />
          <div className="absolute inset-24 rounded-full border border-grid" />
          <div className="absolute inset-0 radar-sweep" style={{
            background: 'conic-gradient(from 0deg, rgba(45,212,200,0.28), transparent 45%)',
            borderRadius: '9999px',
          }} />
          {/* simulated blips */}
          {[
            { top: '22%', left: '58%', color: '#2dd4c8' },
            { top: '68%', left: '30%', color: '#2dd4c8' },
            { top: '40%', left: '75%', color: '#e5484d' },
            { top: '78%', left: '65%', color: '#f5a623' },
            { top: '35%', left: '20%', color: '#60a5fa' },
          ].map((b, i) => (
            <div key={i} className="absolute" style={{ top: b.top, left: b.left, color: b.color }}>
              <div className="relative w-2.5 h-2.5 rounded-full pulse-ring" style={{ background: b.color }} />
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-[10px] text-muted uppercase tracking-widest">Live Scan</div>
              <div className="font-display text-sm text-text mt-1">Vizianagaram Grid</div>
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE STRIP */}
      <section className="border-y border-grid bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-6 gap-6">
          {PIPELINE.map((step, i) => (
            <div key={step} className="text-center">
              <div className="font-mono text-signal text-xs">{String(i + 1).padStart(2, '0')}</div>
              <div className="font-display text-sm mt-1">{step}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl font-semibold mb-8">Built for the whole ecosystem</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-5 rounded-lg border border-grid bg-surface hover:border-signal/40 transition-colors">
              <Icon className="text-signal mb-3" size={22} />
              <h3 className="font-display text-sm font-semibold mb-1.5">{title}</h3>
              <p className="text-xs text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-grid">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted font-mono">
          <div>MOBILITY OS — SIH prototype. All positions, incidents and scores shown are DEMO / SIMULATED DATA.</div>
          <div>Privacy-by-design: no driver, passenger or owner PII is exposed publicly.</div>
        </div>
      </footer>
    </div>
  )
}
