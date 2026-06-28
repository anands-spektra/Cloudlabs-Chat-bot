import { useState } from 'react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import type { Message } from '../../types'
import SuggestionChips from './SuggestionChips'
import EscalationCard from './EscalationCard'
import BotAvatar from './BotAvatar'

interface Props {
  message: Message
  isFirst?: boolean
  onSuggestion?: (text: string) => void
}

export default function MessageBubble({ message, isFirst, onSuggestion }: Props) {
  const isAI = message.role === 'assistant'
  const time = format(new Date(message.created_at), 'hh:mm aa')
  const [copied, setCopied] = useState(false)

  const copyContent = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {isAI && <BotAvatar pulse={message.is_streaming} />}

      <div className={`max-w-[75%] ${isAI ? '' : 'items-end'} flex flex-col group`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isAI
              ? 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm prose prose-sm max-w-none'
              : 'bg-primary-600 text-white rounded-tr-sm whitespace-pre-wrap'
          }`}
        >
          {message.is_streaming ? (
            <span>
              {message.content}
              <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 animate-pulse rounded-sm" />
            </span>
          ) : isAI ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          ) : (
            message.content
          )}
        </div>

        {isAI && message.escalation_needed && <EscalationCard />}

        {isAI && isFirst && onSuggestion && !message.escalation_needed && (
          <SuggestionChips onSelect={onSuggestion} />
        )}

        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[11px] text-gray-400">{time}</span>
          {isAI && !message.is_streaming && (
            <button
              onClick={copyContent}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-all"
              title="Copy response"
            >
              {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
