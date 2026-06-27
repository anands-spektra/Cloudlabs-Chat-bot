import { BookOpen, CheckCircle2, Database, TrendingUp } from 'lucide-react'
import type { AdminMetrics } from '../../types'

interface KPI {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
}

function buildKPIs(m: AdminMetrics): KPI[] {
  return [
    {
      label: 'KNOWLEDGE ARTICLES',
      value: m.knowledge_articles.toLocaleString(),
      sub: '+24 this week',
      icon: <BookOpen size={18} className="text-gray-400" />,
    },
    {
      label: 'RESOLVED QUERIES',
      value: m.resolved_queries.toLocaleString(),
      sub: `+${m.resolution_rate.toFixed(0)}% vs last month`,
      icon: <CheckCircle2 size={18} className="text-gray-400" />,
    },
    {
      label: 'CONNECTED SOURCES',
      value: m.connected_sources,
      sub: '2 syncing',
      icon: <Database size={18} className="text-gray-400" />,
    },
    {
      label: 'SEARCH SUCCESS RATE',
      value: `${m.search_success_rate.toFixed(0)}%`,
      sub: '+3.4%',
      icon: <TrendingUp size={18} className="text-gray-400" />,
    },
  ]
}

const MOCK: AdminMetrics = {
  total_sessions: 120,
  active_sessions: 8,
  tickets_resolved_by_ai: 832,
  open_tickets: 14,
  transferred_tickets: 6,
  resolution_rate: 12,
  avg_satisfaction: 4.3,
  total_tokens: 5_400_000,
  prompt_tokens: 3_200_000,
  completion_tokens: 2_200_000,
  knowledge_articles: 1248,
  search_success_rate: 92,
  connected_sources: 14,
  resolved_queries: 832,
}

export default function KPICards({ metrics = MOCK }: { metrics?: AdminMetrics }) {
  const kpis = buildKPIs(metrics)
  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start justify-between"
        >
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {k.label}
            </p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.sub}</p>
          </div>
          <div className="mt-0.5">{k.icon}</div>
        </div>
      ))}
    </div>
  )
}
