import { useEffect, useRef } from 'react'
import type { Message } from '../../types'
import MessageBubble from './MessageBubble'
import { Loader2 } from 'lucide-react'

interface Props {
  messages: Message[]
  isLoading: boolean
  onSuggestion: (text: string) => void
}

export default function MessageList({ messages, isLoading, onSuggestion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isFirst={i === 0 && msg.role === 'assistant'}
          onSuggestion={onSuggestion}
        />
      ))}

      {isLoading && (
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
  )
}
