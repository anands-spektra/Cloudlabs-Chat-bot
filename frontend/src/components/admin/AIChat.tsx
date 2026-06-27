import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Loader2, Paperclip } from 'lucide-react'
import { adminApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

interface Msg {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: string
}

const WELCOME: Msg = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm the CloudLabs AI Agent.\n\nI can help with lab provisioning, deployments, LMS integration, billing, Azure migration, and more. What do you need help with today?",
  ts: new Date().toISOString(),
}

export default function AIChat() {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = async () => {
    const q = text.trim()
    if (!q || loading) return
    setText('')

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: q, ts: new Date().toISOString() }
    setMsgs((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const { data: tickets } = await adminApi.getTickets({ limit: 1 })
      const session_id = tickets.tickets[0]?.session_id
      if (!session_id) throw new Error('no session')
      const resp = await adminApi.getSessionMessages(session_id)
      const lastMsg = (resp.data as Msg[]).filter((m) => m.role === 'assistant').slice(-1)[0]
      const aiMsg: Msg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: lastMsg?.content ?? "I couldn't find a relevant answer. Please try rephrasing.",
        ts: new Date().toISOString(),
      }
      setMsgs((prev) => [...prev, aiMsg])
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          ts: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">AI Chat</h2>
        <p className="text-sm text-gray-500">Ask anything about lab operations and knowledge.</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {msgs.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                m.role === 'assistant' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {m.role === 'assistant' ? 'AI' : (user?.name[0] ?? 'U')}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'assistant'
                  ? 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
                  : 'bg-primary-600 text-white rounded-tr-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm">
                <Loader2 size={14} className="animate-spin text-primary-500" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-2">
          <button className="text-gray-400 hover:text-primary-600 transition-colors">
            <Paperclip size={16} />
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask anything about labs, billing, or…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={loading || !text.trim()}
            className="w-8 h-8 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowUp size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
