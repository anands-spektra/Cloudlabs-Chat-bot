import { useEffect, useState } from 'react'
import { Search, Filter, Loader2, ChevronRight } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Ticket, TicketStatus } from '../../types'
import { format } from 'date-fns'

const STATUS_COLORS: Record<TicketStatus, string> = {
  new:                    'bg-blue-100 text-blue-700',
  in_progress_ai:         'bg-yellow-100 text-yellow-700',
  resolved_by_ai:         'bg-green-100 text-green-700',
  open:                   'bg-orange-100 text-orange-700',
  transferred_to_support: 'bg-purple-100 text-purple-700',
  closed:                 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  new:                    'New',
  in_progress_ai:         'In Progress',
  resolved_by_ai:         'Resolved',
  open:                   'Open',
  transferred_to_support: 'Transferred',
  closed:                 'Closed',
}

export default function IssueExplorer() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminApi
      .getTickets({ limit: 50 })
      .then(({ data }) => setTickets(data.tickets))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = tickets.filter(
    (t) =>
      !search ||
      (t.user_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Issue Explorer</h2>
        <span className="text-sm text-gray-500">{tickets.length} total issues</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, email, or ticket ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Filter size={13} />
            Filter
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={18} className="animate-spin text-primary-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Ticket ID</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Last update</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No issues found
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{t.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{t.user_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{t.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {format(new Date(t.created_at), 'MMM d, h:mm aa')}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {format(new Date(t.updated_at), 'MMM d, h:mm aa')}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-gray-300" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
