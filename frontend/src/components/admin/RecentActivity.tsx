import { useEffect, useState } from 'react'
import { Clock, Search } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { ActivityItem } from '../../types'
import { formatDistanceToNow } from 'date-fns'

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', user_name: 'Priya Nair',    user_initials: 'PN', action: 'opened article',    detail: 'WiFi handoff failure on Lab-12',         timestamp: new Date(Date.now() - 2*60*1000).toISOString() },
  { id: '2', user_name: 'Marcus Lee',    user_initials: 'ML', action: 'asked agent',       detail: '"Why does the spectrum analyzer drop calibration?"', timestamp: new Date(Date.now() - 8*60*1000).toISOString() },
  { id: '3', user_name: 'Sofia Rossi',   user_initials: 'SR', action: 'synced source',     detail: 'Release Notes Q2-2025.xlsx',             timestamp: new Date(Date.now() - 21*60*1000).toISOString() },
  { id: '4', user_name: 'Daniel Kim',    user_initials: 'DK', action: 'resolved issue',    detail: 'ISSUE-2041 Firmware rollback',           timestamp: new Date(Date.now() - 60*60*1000).toISOString() },
  { id: '5', user_name: 'Anna Becker',   user_initials: 'AB', action: 'saved conversation',detail: 'BLE pairing troubleshooting',            timestamp: new Date(Date.now() - 3*60*60*1000).toISOString() },
]

const RECENT_SEARCHES = [
  'How to recover Lab-07 after firmware crash?',
  'Spectrum analyzer calibration drift on cold start',
  'BLE pairing fails after firmware 4.12',
  'WiFi 6E roaming handoff dropouts',
  'Power supply ripple anomaly in Lab-22',
]

const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

export default function RecentActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>(MOCK_ACTIVITY)

  useEffect(() => {
    adminApi.getActivity()
      .then(({ data }) => setActivity(data))
      .catch(() => {/* use mock */})
  }, [])

  return (
    <div className="grid grid-cols-[1fr_320px] gap-4">
      {/* Activity */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Recent activity</h3>
            <p className="text-xs text-gray-500">What your team has been doing.</p>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View all
          </button>
        </div>

        <div className="space-y-3">
          {activity.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                  COLORS[i % COLORS.length]
                }`}
              >
                {item.user_initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  <span className="font-medium">{item.user_name}</span>{' '}
                  <span className="text-gray-500">{item.action}</span>{' '}
                  <span className="font-medium text-gray-800">{item.detail}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                <Clock size={11} />
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent searches */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent searches</h3>
          <p className="text-xs text-gray-500">Pick up where you left off.</p>
        </div>

        <div className="space-y-2.5">
          {RECENT_SEARCHES.map((q) => (
            <button
              key={q}
              className="w-full flex items-center gap-2.5 text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors group"
            >
              <Search size={13} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 group-hover:text-primary-700 truncate">{q}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
