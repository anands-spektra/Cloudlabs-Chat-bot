import { useEffect, useRef } from 'react'
import type { Message } from '../../types'
import MessageBubble from './MessageBubble'
import BotAvatar from './BotAvatar'

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
        <div className="flex gap-3 items-end">
          <BotAvatar pulse />
          <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
