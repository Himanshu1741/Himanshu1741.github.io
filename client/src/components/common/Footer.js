/**
 * Footer Component
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Real-Time Collab Hub
          </span>
          <span className="hidden sm:inline">•</span>
          <span>Developed by Himanshu Kumar</span>
        </div>
        <p className="mb-1">
          © {currentYear} Himanshu Kumar. All rights reserved.
        </p>
        <p className="text-[11px]">
          A real-time collaboration platform for team project management
        </p>
      </div>
    </footer>
  );
}
