import { useEffect } from 'react'
import { X, MoreVertical, Loader2 } from 'lucide-react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import BotAvatar from './BotAvatar'
import { useChat } from '../../hooks/useChat'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'

export default function ChatWidget() {
  const { messages, isLoading, isStarting, sendMessage, closeSession } = useChat()
  const { session, ticket } = useChatStore()
  const { user, clearAuth } = useAuthStore()

  const handleSuggestion = (text: string) => sendMessage(text)

  const handleClose = async () => {
    if (session) await closeSession()
    clearAuth()
    window.location.href = '/auth'
  }

  if (isStarting) {
    return (
      <div className="w-[540px] h-[680px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center mx-auto">
            <BotAvatar size="md" />
          </div>
          <Loader2 size={20} className="animate-spin text-primary-500 mx-auto" />
          <p className="text-sm text-gray-500">Starting session…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[540px] h-[680px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 shrink-0">
        <BotAvatar size="md" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">CloudLabs Assistant</p>
          <p className="text-xs text-primary-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Online · AI-powered support
          </p>
        </div>

        {ticket && (
          <span className="text-[10px] text-gray-400 font-mono border border-gray-200 rounded px-1.5 py-0.5">
            #{ticket.id.slice(0, 8).toUpperCase()}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <MoreVertical size={14} />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSuggestion={handleSuggestion}
      />

      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={isLoading || !session} />
    </div>
  )
}
