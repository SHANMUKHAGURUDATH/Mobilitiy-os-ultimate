import { useMemo, useState } from 'react'
import { Card } from '../components/ui'
import { useFleet } from '../lib/useFleet'
import { generateRiskZones, generateIncidents } from '../data/urban'
import { Bot, Send } from 'lucide-react'

const SUGGESTIONS = [
  'Which areas have the highest accident risk?',
  'Which buses are delayed?',
  'What roads are affected by flooding?',
  'Which vehicles have maintenance warnings?',
]

export default function Assistant() {
  const { fleet } = useFleet()
  const zones = useMemo(() => generateRiskZones(24), [])
  const incidents = useMemo(() => generateIncidents(30), [])
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Ask me about live vehicles, risk zones, or road incidents on the platform. I only answer from authorized, currently loaded data — never private user records.' },
  ])
  const [input, setInput] = useState('')

  function answer(q: string): string {
    const lower = q.toLowerCase()
    if (lower.includes('risk')) {
      const top = [...zones].sort((a, b) => b.score - a.score).slice(0, 3)
      return `Highest-risk zones right now: ${top.map((z) => `${z.id} (${z.level}, score ${z.score})`).join(', ')}.`
    }
    if (lower.includes('delay')) {
      const delayed = fleet.filter((v) => v.status === 'DELAYED')
      return delayed.length ? `${delayed.length} vehicles are delayed: ${delayed.map((v) => v.id).join(', ')}.` : 'No vehicles are currently delayed.'
    }
    if (lower.includes('flood')) {
      const floods = incidents.filter((i) => i.type === 'FLOODING' && i.status !== 'RESOLVED')
      return floods.length ? `${floods.length} unresolved flooding reports, including ${floods[0].id} (${floods[0].description}).` : 'No active flooding reports.'
    }
    if (lower.includes('maintenance')) {
      return 'Maintenance warnings are scoped to your own vehicles — open "My Vehicles" to see your maintenance score and recommended inspections.'
    }
    if (lower.includes('ambulance') || lower.includes('emergency')) {
      const emr = fleet.filter((v) => v.category === 'EMERGENCY')
      return `${emr.length} emergency vehicles are currently active on simulated routes.`
    }
    return "I can answer questions about live vehicles, risk zones, delays, flooding and emergency activity from the data currently loaded in this session."
  }

  function send(q?: string) {
    const text = q ?? input
    if (!text.trim()) return
    setMessages((prev) => [...prev, { role: 'user', text }, { role: 'assistant', text: answer(text) }])
    setInput('')
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Bot size={18} className="text-signal" />
        <h1 className="font-display text-xl font-semibold">AI Decision Support</h1>
      </div>

      <Card className="p-4">
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`text-sm max-w-[85%] rounded-lg px-3 py-2 ${m.role === 'user' ? 'ml-auto bg-signal text-ink' : 'bg-surface-raised border border-grid'}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about risk, delays, flooding, emergencies…"
            className="flex-1 bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none focus:border-signal/60"
          />
          <button onClick={() => send()} className="px-3 py-2 rounded-md bg-signal text-ink"><Send size={16} /></button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-grid text-muted hover:border-signal/50 hover:text-signal">
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
