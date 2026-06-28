const SUGGESTIONS = [
  { emoji: '🔌', text: 'My Lab VM is not connecting' },
  { emoji: '📋', text: 'Validation is failing' },
  { emoji: '📎', text: 'Copy/Paste is not working' },
  { emoji: '🔑', text: 'Unable to sign in to the VM' },
  { emoji: '🚀', text: 'Lab deployment failed' },
]

export default function SuggestionChips({
  onSelect,
}: {
  onSelect: (text: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.text}
          onClick={() => onSelect(s.text)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-left hover:border-primary-300 hover:bg-primary-50 transition-all duration-150 group"
        >
          <span className="text-base leading-none shrink-0">{s.emoji}</span>
          <span className="text-xs font-medium text-gray-700 group-hover:text-primary-700 leading-snug">
            {s.text}
          </span>
        </button>
      ))}
    </div>
  )
}
