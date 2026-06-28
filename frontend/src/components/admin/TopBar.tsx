import { useEffect, useRef } from 'react'
import { Search, Bell, Settings, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function TopBar() {
  const { user, clearAuth } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') inputRef.current?.blur()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search articles, issues, sources…"
            className="w-full pl-8 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono bg-gray-100 px-1 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="relative w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
          <Settings size={16} />
        </button>

        <button
          onClick={clearAuth}
          className="flex items-center gap-2 ml-1 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
          title="Sign out"
        >
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">
              {user ? initials(user.name) : 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {user?.name.split(' ')[0] ?? 'Admin'}
          </span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>
      </div>
    </header>
  )
}
