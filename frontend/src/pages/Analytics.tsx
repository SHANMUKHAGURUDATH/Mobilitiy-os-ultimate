import { useMemo } from 'react'
import { Card, CardHeader } from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { useFleet } from '../lib/useFleet'
import { CATEGORY_LABEL, CATEGORY_COLOR } from '../data/vehicles'
import { generateRiskZones } from '../data/urban'

export default function Analytics() {
  const { fleet } = useFleet()
  const zones = useMemo(() => generateRiskZones(24), [])

  const byCategory = Object.entries(CATEGORY_LABEL).map(([key, label]) => ({
    name: label,
    value: fleet.filter((v) => v.category === key).length,
    color: CATEGORY_COLOR[key as keyof typeof CATEGORY_COLOR],
  }))

  const riskDist = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => ({
    name: lvl,
    value: zones.filter((z) => z.level === lvl).length,
  }))

  const trend = Array.from({ length: 12 }, (_, i) => ({
    hour: `${i * 2}:00`,
    incidents: Math.floor(3 + Math.sin(i / 2) * 3 + Math.random() * 4),
  }))

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold">Analytics</h1>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-4">
          <CardHeader title="Fleet by Category" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {byCategory.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a2438', border: '1px solid #223052', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <CardHeader title="Risk Zone Distribution" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDist}>
                <XAxis dataKey="name" stroke="#7c8aa3" fontSize={11} />
                <YAxis stroke="#7c8aa3" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1a2438', border: '1px solid #223052', fontSize: 12 }} />
                <Bar dataKey="value" fill="#2dd4c8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <CardHeader title="Reported Incidents — Last 24h (simulated)" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke="#223052" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#7c8aa3" fontSize={11} />
                <YAxis stroke="#7c8aa3" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1a2438', border: '1px solid #223052', fontSize: 12 }} />
                <Line type="monotone" dataKey="incidents" stroke="#f5a623" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
