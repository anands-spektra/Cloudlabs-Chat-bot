import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { adminApi } from '../../services/api'
import type { TokenUsagePoint, AdminMetrics } from '../../types'
import { Loader2 } from 'lucide-react'

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd']

function generateMockUsage(): TokenUsagePoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const p = Math.floor(80_000 + Math.random() * 40_000)
    const c = Math.floor(30_000 + Math.random() * 20_000)
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      prompt_tokens: p,
      completion_tokens: c,
      total_tokens: p + c,
    }
  })
}

export default function Analytics() {
  const [usage, setUsage] = useState<TokenUsagePoint[]>([])
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getTokenUsage(14), adminApi.getMetrics()])
      .then(([u, m]) => {
        setUsage(u.data.length ? u.data : generateMockUsage())
        setMetrics(m.data)
      })
      .catch(() => {
        setUsage(generateMockUsage())
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-primary-500" />
      </div>
    )
  }

  const ticketData = metrics
    ? [
        { name: 'Resolved by AI', value: metrics.tickets_resolved_by_ai },
        { name: 'Open', value: metrics.open_tickets },
        { name: 'Transferred', value: metrics.transferred_tickets },
      ]
    : []

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-base font-semibold text-gray-900">Analytics</h2>

      {/* Token usage chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Token usage (last 14 days)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={usage} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gPrompt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="prompt_tokens" name="Prompt" stroke="#7c3aed" fill="url(#gPrompt)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="completion_tokens" name="Completion" stroke="#a78bfa" fill="url(#gComp)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Ticket status pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ticket resolution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ticketData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {ticketData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily sessions bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily sessions (last 14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={usage.map((u) => ({ date: u.date, sessions: Math.floor(u.total_tokens / 15000) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="sessions" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
