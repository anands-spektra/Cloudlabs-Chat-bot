import { useState } from 'react'
import SignIn from '../components/auth/SignIn'
import SignUp from '../components/auth/SignUp'
import BotAvatar from '../components/chat/BotAvatar'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 [&>div]:w-20 [&>div]:h-20 [&_svg]:w-9 [&_svg]:h-9">
              <BotAvatar pulse />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CloudLabs Assistant</h1>
          <p className="text-gray-500 text-sm mt-1">AI-powered lab support platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'signin' ? (
            <SignIn onSwitch={() => setMode('signup')} />
          ) : (
            <SignUp onSwitch={() => setMode('signin')} />
          )}
        </div>
      </div>
    </div>
  )
}
