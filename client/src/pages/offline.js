// OFFLINE FALLBACK PAGE
// Shown by the service worker when the user is offline and the page isn't cached
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center">
      {/* Animated offline icon */}
      <div className="relative mb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-2xl shadow-violet-500/30">
          <svg
            viewBox="0 0 24 24"
            className="h-14 w-14 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
            <path
              d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* Pulse ring */}
        <span className="absolute inset-0 animate-ping rounded-3xl bg-violet-500 opacity-10" />
      </div>

      <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white">
        You&apos;re Offline
      </h1>
      <p className="mb-1 max-w-sm text-sm text-slate-400">
        CollabHub can&apos;t reach the internet right now. Pages you&apos;ve
        visited recently are still available below.
      </p>
      <p className="mb-8 text-xs text-slate-600">
        Changes you make will sync automatically when you&apos;re back online.
      </p>

      {/* Quick links to cached pages */}
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {[
          { href: "/dashboard", emoji: "🏠", label: "Dashboard" },
          { href: "/projects", emoji: "📁", label: "My Projects" },
          { href: "/deadlines", emoji: "📅", label: "Deadlines" },
          { href: "/profile", emoji: "👤", label: "My Profile" },
        ].map(({ href, emoji, label }) => (
          <a
            key={href}
            href={href}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-violet-500/40 hover:bg-slate-800 hover:text-white"
          >
            <span>{emoji}</span>
            {label}
          </a>
        ))}
      </div>

      {/* Retry button */}
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-600 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            d="M1 4v6h6M23 20v-6h-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Try Again
      </button>

      {/* CollabHub branding */}
      <p className="mt-10 text-xs text-slate-700">
        CollabHub &mdash; Real-time Collaboration Hub
      </p>
    </div>
  );
}
