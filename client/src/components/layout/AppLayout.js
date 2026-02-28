import { useState } from "react";
import { useRouter } from "next/router";
import NotificationBell from "../common/NotificationBell";
import GlobalSearch from "../common/GlobalSearch";
import { useTheme } from "../../context/ThemeContext";

const NAV = [
  { key: "dashboard", label: "Dashboard", emoji: "🏠", href: "/dashboard" },
  { key: "projects", label: "My Projects", emoji: "📁", href: "/projects" },
  { key: "deadlines", label: "Deadlines", emoji: "📅", href: "/deadlines" },
  { key: "profile", label: "My Profile", emoji: "👤", href: "/profile" },
  { key: "settings", label: "Settings", emoji: "⚙", href: "/settings" },
  { key: "trash", label: "Trash", emoji: "🗑", href: "/trash" },
];

function Avatar({ name, size = "md" }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colours = [
    "from-cyan-500 to-blue-500",
    "from-violet-500 to-purple-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
  ];
  const bg = colours[initials.charCodeAt(0) % colours.length];
  const sz = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${bg} ${sz[size]}`}
    >
      {initials}
    </div>
  );
}

export default function AppLayout({
  user,
  activeTab,
  onLogout,
  children,
  headerRight,
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [...NAV];
  if (user?.role === "admin") {
    items.push({
      key: "admin",
      label: "Admin Center",
      emoji: "🛡",
      href: "/admin",
    });
  }

  const currentItem = items.find((i) => i.key === activeTab);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        .page-fade { animation: fadeUp 0.2s ease; }
      `}</style>

      {/* ── Mobile overlay ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`
          flex flex-col border-r border-slate-200 bg-white transition-all duration-300 z-40 shrink-0 dark:border-slate-800 dark:bg-slate-950
          fixed inset-y-0 left-0 md:relative
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        style={{ width: sidebarOpen ? 220 : 64 }}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-4">
          <div
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/20"
            onClick={() => router.push("/dashboard")}
          >
            S
          </div>
          {sidebarOpen && (
            <span className="truncate text-sm font-bold text-white">
              Student<span className="text-cyan-400">Collab</span>
            </span>
          )}
          <button
            className="ml-auto shrink-0 rounded-lg p-1.5 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "<<" : ">>"}
          </button>
        </div>

        {sidebarOpen && (
          <div className="border-b border-slate-800 px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Workspace
            </p>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-700 border border-cyan-500/20 dark:text-cyan-300"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent dark:hover:bg-slate-800/60 dark:hover:text-slate-300"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="shrink-0 text-base leading-none">
                  {item.emoji}
                </span>
                {sidebarOpen && (
                  <span className="flex-1 truncate text-left">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div
            className={`flex items-center gap-2.5 ${sidebarOpen ? "" : "justify-center"}`}
          >
            <Avatar name={user?.name} size="sm" />
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {user?.name}
                </p>
                <p className="text-[10px] capitalize text-slate-500 dark:text-slate-600">
                  {user?.role || "member"}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={onLogout}
                className="shrink-0 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-slate-500 hover:bg-rose-500/10 hover:text-rose-600 transition border border-transparent hover:border-rose-500/20 dark:text-slate-600 dark:hover:text-rose-400"
                title="Sign out"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 z-10 dark:border-slate-800 dark:bg-slate-950/80 sm:px-6"
          style={{ backdropFilter: "blur(12px)" }}
        >
          {/* Hamburger — mobile only */}
          <button
            className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
              {currentItem?.emoji} {currentItem?.label || "Workspace"}
            </h1>
            <p className="hidden text-[11px] text-slate-400 dark:text-slate-600 sm:block">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {headerRight}
            <div className="hidden w-48 lg:block">
              <GlobalSearch />
            </div>
            <NotificationBell />
            <button
              className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              onClick={toggleTheme}
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path
                    d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 page-fade sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
