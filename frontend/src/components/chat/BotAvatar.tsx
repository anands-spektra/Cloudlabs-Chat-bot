interface Props {
  pulse?: boolean
  size?: 'sm' | 'md'
}

export default function BotAvatar({ pulse = false, size = 'md' }: Props) {
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  return (
    <div className={`relative shrink-0 ${dim}${size === 'md' ? ' animate-float' : ''}`}>
      {pulse && (
        <span className="absolute inset-0 rounded-full bg-primary-400 opacity-30 animate-ping" />
      )}
      <div className={`relative ${dim} rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
          {/* head */}
          <rect x="5" y="7" width="14" height="10" rx="3" fill="white" opacity="0.95" />
          {/* eyes */}
          <circle cx="9" cy="11" r="1.5" fill="#7c3aed" />
          <circle cx="15" cy="11" r="1.5" fill="#7c3aed" />
          {/* mouth */}
          <path d="M9.5 14.5 Q12 16 14.5 14.5" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* antenna */}
          <line x1="12" y1="7" x2="12" y2="4" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
          <circle cx="12" cy="3.5" r="1" fill="white" opacity="0.9" />
          {/* ears */}
          <rect x="3" y="9.5" width="2.5" height="4" rx="1" fill="white" opacity="0.8" />
          <rect x="18.5" y="9.5" width="2.5" height="4" rx="1" fill="white" opacity="0.8" />
        </svg>
      </div>
    </div>
  )
}
