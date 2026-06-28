export default function SettingsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center select-none">
      {/* Animated cog stack */}
      <div className="relative w-24 h-24 mb-8">
        <svg
          viewBox="0 0 96 96"
          className="absolute inset-0 w-full h-full animate-spin-slow text-primary-200"
          style={{ animationDuration: '8s' }}
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M48 12a4 4 0 0 1 4 4v4.6a24.1 24.1 0 0 1 7.2 3L63.5 20a4 4 0 0 1 5.7 0l3.8 3.8a4 4 0 0 1 0 5.7l-3.6 3.3c.7 2.3 1 4.7 1 7.2h4.6a4 4 0 0 1 4 4v5.4a4 4 0 0 1-4 4h-4.6a24 24 0 0 1-3 7.2l3.6 3.3a4 4 0 0 1 0 5.7l-3.8 3.8a4 4 0 0 1-5.7 0l-3.3-3.6a24 24 0 0 1-7.2 3V76a4 4 0 0 1-4 4h-5.4a4 4 0 0 1-4-4v-4.6a24 24 0 0 1-7.2-3L28.1 72a4 4 0 0 1-5.7 0l-3.8-3.8a4 4 0 0 1 0-5.7l3.6-3.3a24 24 0 0 1-3-7.2H14.4a4 4 0 0 1-4-4V42.6a4 4 0 0 1 4-4H19a24 24 0 0 1 3-7.2l-3.6-3.3a4 4 0 0 1 0-5.7L22.4 18a4 4 0 0 1 5.7 0l3.3 3.6a24 24 0 0 1 7.2-3V14a4 4 0 0 1 4-4h5.4Z"
          />
        </svg>
        <svg
          viewBox="0 0 96 96"
          className="absolute inset-0 w-full h-full text-primary-500"
          style={{ animation: 'spin 12s linear infinite reverse' }}
          aria-hidden="true"
        >
          <circle cx="48" cy="48" r="14" fill="currentColor" />
        </svg>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
          .animate-spin-slow { animation: spin 8s linear infinite; }
        `}</style>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">Settings are on their way</h2>
      <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-6">
        Our engineers are busy wiring up powerful customisation options — model selection,
        escalation rules, branding, and more. Check back soon!
      </p>

      {/* Feature preview chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {[
          '🎨 Custom branding',
          '🤖 Model selection',
          '📧 Email notifications',
          '🔑 SSO / SAML',
          '📊 Reporting',
          '🔔 Alert rules',
        ].map((label) => (
          <span
            key={label}
            className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
