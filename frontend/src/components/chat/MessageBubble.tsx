import { format } from 'date-fns'
import type { Message } from '../../types'
import SuggestionChips from './SuggestionChips'

interface Props {
  message: Message
  isFirst?: boolean
  onSuggestion?: (text: string) => void
}

export default function MessageBubble({ message, isFirst, onSuggestion }: Props) {
  const isAI = message.role === 'assistant'
  const time = format(new Date(message.created_at), 'hh:mm aa')

  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}

      <div className={`max-w-[75%] ${isAI ? '' : 'items-end'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isAI
              ? 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
              : 'bg-primary-600 text-white rounded-tr-sm'
          }`}
        >
          {message.is_streaming ? (
            <span>
              {message.content}
              <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 animate-pulse rounded-sm" />
            </span>
          ) : (
            message.content
          )}
        </div>

        {isAI && isFirst && onSuggestion && (
          <SuggestionChips onSelect={onSuggestion} />
        )}

        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.citations.map((c) => (
              <a
                key={c.id}
                href={c.source_url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-primary-600 hover:text-primary-700 underline underline-offset-2"
              >
                {c.source_title}
              </a>
            ))}
          </div>
        )}

        <span className="text-[11px] text-gray-400 mt-1 px-1">{time}</span>
      </div>
    </div>
  )
}
