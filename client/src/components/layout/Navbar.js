import { useRouter } from "next/router";
import NotificationBell from "../common/NotificationBell";
import GlobalSearch from "../common/GlobalSearch";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar({ title, showDashboard = false, showSettings = false, onLogout, showSearch = true }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="glass-card mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-cyan-200/80">Real-Time Collab Hub</p>
        <h2 className="text-xl font-semibold text-slate-100 md:text-2xl">{title}</h2>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
        {showSearch && (
          <div className="hidden w-full max-w-xs sm:block">
            <GlobalSearch />
          </div>
        )}
        <NotificationBell />
        {showSettings ? (
          <button
            className="btn-secondary !px-2.5"
            aria-label="Open settings"
            title="Settings"
            onClick={() => router.push("/settings")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
              <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
            </svg>
          </button>
        ) : null}
        {showDashboard ? (
          <button
            className="btn-secondary"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </button>
        ) : null}
        {/* Theme toggle */}
        <button
          className="btn-secondary !px-2.5"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <button
          className="btn-danger"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
