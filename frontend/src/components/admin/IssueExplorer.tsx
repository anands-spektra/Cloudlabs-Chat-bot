import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, Loader2, ChevronRight, X, RefreshCw } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Message, Ticket, TicketStatus } from '../../types'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

interface DetailPanelProps {
  ticketId: string
  onClose: () => void
}

function DetailPanel({ ticketId, onClose }: DetailPanelProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .getTicketDetail(ticketId)
      .then(({ data }) => {
        setTicket(data.ticket)
        setMessages(data.messages)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ticketId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">
            Ticket #{ticketId.slice(0, 8).toUpperCase()}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1 h-40">
            <Loader2 size={18} className="animate-spin text-primary-500" />
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto">
            {/* Ticket fields */}
            <div className="px-5 py-4 space-y-2 border-b border-gray-100 text-sm">
              {ticket.subject && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</span>
                  <p className="text-gray-900 mt-0.5">{ticket.subject}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                {ticket.deployment_id && (
                  <div><span className="font-medium text-gray-500">Deployment ID: </span>{ticket.deployment_id}</div>
                )}
                {ticket.lab_name && (
                  <div><span className="font-medium text-gray-500">Lab Name: </span>{ticket.lab_name}</div>
                )}
                {ticket.issue_summary && (
                  <div className="col-span-2"><span className="font-medium text-gray-500">Issue: </span>{ticket.issue_summary}</div>
                )}
                {ticket.detailed_description && (
                  <div className="col-span-2"><span className="font-medium text-gray-500">Description: </span>{ticket.detailed_description}</div>
                )}
                <div><span className="font-medium text-gray-500">User: </span>{ticket.user_name} ({ticket.user_email})</div>
                <div><span className="font-medium text-gray-500">Status: </span>
                  <span className={`ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <div><span className="font-medium text-gray-500">Raised: </span>{format(new Date(ticket.created_at), 'MMM d, yyyy h:mm aa')}</div>
              </div>
            </div>

            {/* Chat history */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chat History</p>
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      m.role === 'assistant'
                        ? 'bg-gray-50 border border-gray-100 text-gray-800 prose prose-xs'
                        : 'bg-primary-600 text-white whitespace-pre-wrap'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    ) : m.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 h-40 text-sm text-gray-400">
            Ticket not found
          </div>
        )}
      </div>
    </div>
  )
}

export default function IssueExplorer() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const { data } = await adminApi.getTickets({ limit: 100 })
      setTickets(data.tickets)
      setLastRefreshed(new Date())
    } catch {
      // keep existing list on error
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const filtered = tickets.filter(
    (t) =>
      !search ||
      (t.user_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl space-y-4">
      {selectedId && <DetailPanel ticketId={selectedId} onClose={() => setSelectedId(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Issue Explorer</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {tickets.length} tickets · refreshed {format(lastRefreshed, 'h:mm:ss aa')}
          </p>
        </div>
        <button
          onClick={() => fetchTickets(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, email, ticket ID, or subject…"
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
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Created</th>
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
                  <tr
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{t.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{t.user_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{t.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px]">
                      <span className="block truncate">
                        {t.subject ?? t.issue_summary ?? (t.last_message ? `"${t.last_message.slice(0, 60)}${t.last_message.length > 60 ? '…' : ''}"` : <span className="text-gray-300 italic">No subject yet</span>)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {format(new Date(t.created_at), 'MMM d, h:mm aa')}
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
