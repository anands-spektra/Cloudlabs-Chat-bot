const SUGGESTIONS = [
  "Lab won't provision",
  'Debug a deployment',
  'LMS integration',
  'Azure Lab Services migration',
]

export default function SuggestionChips({
  onSelect,
}: {
  onSelect: (text: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-3.5 py-1.5 rounded-full border border-primary-300 text-primary-700 text-xs font-medium bg-white hover:bg-primary-50 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
