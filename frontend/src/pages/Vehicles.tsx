import { useEffect, useState } from 'react'
import { Card, StatusPill, PrimaryButton } from '../components/ui'
import { VehiclesApi, type VehicleDTO } from '../lib/api'
import { Plus, Trash2, Pencil, RefreshCw } from 'lucide-react'

const CATEGORIES = ['RTC_BUS', 'COLLEGE_BUS', 'PRIVATE_BUS', 'EMERGENCY', 'HAZMAT', 'TAXI', 'AUTO', 'TRUCK', 'TWO_WHEELER', 'OTHER']

const emptyForm = { registrationNumber: '', vehicleType: '', category: 'RTC_BUS', operator: '' }

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (query) params.search = query
      if (category !== 'ALL') params.category = category
      const data = await VehiclesApi.list(params)
      setVehicles(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [query, category]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setSaving(true)
    try {
      if (editing) {
        await VehiclesApi.update(editing, form)
      } else {
        await VehiclesApi.create(form as any)
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this vehicle? This cannot be undone.')) return
    try {
      await VehiclesApi.remove(id)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  function startEdit(v: VehicleDTO) {
    setEditing(v.id)
    setForm({ registrationNumber: v.registrationNumber, vehicleType: v.vehicleType, category: v.category, operator: v.operator || '' })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Vehicle Registry</h1>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 rounded-md border border-grid text-xs inline-flex items-center gap-1"><RefreshCw size={14} /> Refresh</button>
          <PrimaryButton onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm) }} className="inline-flex items-center gap-2">
            <Plus size={16} /> Add Vehicle
          </PrimaryButton>
        </div>
      </div>

      {error && <Card className="p-3 border-red-500/40 text-red-400 text-xs">{error}</Card>}

      {showForm && (
        <Card className="p-4 space-y-3">
          <div className="grid md:grid-cols-4 gap-3">
            <input placeholder="Registration number" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none" />
            <input placeholder="Vehicle type (e.g. Bus)" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Operator (optional)" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })}
              className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={submit} disabled={saving || !form.registrationNumber || !form.vehicleType}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create vehicle'}
            </PrimaryButton>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="px-3 py-1.5 rounded-md border border-grid text-xs">Cancel</button>
          </div>
          <p className="text-[11px] text-muted font-mono">Requires a SUPER_ADMIN / AUTHORITY / TRANSPORT_OPERATOR bearer token — see /system for auth status.</p>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search registration / operator…"
          className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none w-64" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-surface-raised border border-grid rounded-md px-3 py-2 text-sm outline-none">
          <option value="ALL">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card className="overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-muted">Loading…</p>
        ) : vehicles.length === 0 ? (
          <p className="p-6 text-sm text-muted">No vehicles registered.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs uppercase font-mono border-b border-grid">
                <th className="px-4 py-3">Registration</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Connection</th>
                <th className="px-4 py-3">Last Update</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-grid last:border-0 hover:bg-surface-raised/50">
                  <td className="px-4 py-3 font-mono text-signal">{v.registrationNumber}</td>
                  <td className="px-4 py-3">{v.category}</td>
                  <td className="px-4 py-3"><StatusPill tone={v.status === 'ON_ROUTE' ? 'signal' : v.status === 'DELAYED' ? 'amber' : 'muted'}>{v.status}</StatusPill></td>
                  <td className="px-4 py-3"><StatusPill tone={v.connectionStatus === 'LIVE' ? 'signal' : v.connectionStatus === 'STALE' ? 'amber' : 'muted'}>{v.connectionStatus}</StatusPill></td>
                  <td className="px-4 py-3 font-mono text-xs">{v.lastUpdateAt ? new Date(v.lastUpdateAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => startEdit(v)} className="p-1.5 rounded border border-grid"><Pencil size={14} /></button>
                    <button onClick={() => remove(v.id)} className="p-1.5 rounded border border-red-500/40 text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
