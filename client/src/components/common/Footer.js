/**
 * Footer Component
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full shrink-0 border-t border-slate-200 dark:border-slate-800">
      <style>{`
        .footer-container {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%);
          backdrop-filter: blur(8px);
          border-top: 2px solid rgba(34, 211, 238, 0.2);
        }

        .footer-container.light {
          background: linear-gradient(135deg, rgba(241, 245, 249, 0.8) 0%, rgba(226, 232, 240, 0.9) 100%);
          border-top: 2px solid rgba(8, 145, 178, 0.2);
        }

        .copyright-text {
          background: linear-gradient(90deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .copyright-text.light {
          background: linear-gradient(90deg, #0891b2 0%, #06b6d4 50%, #0284c7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .developer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.3);
          color: #22d3ee;
          transition: all 0.3s ease;
        }

        .developer-badge:hover {
          background: rgba(34, 211, 238, 0.2);
          border-color: rgba(34, 211, 238, 0.5);
          transform: translateY(-2px);
        }

        .developer-badge.light {
          background: rgba(8, 145, 178, 0.1);
          border: 1px solid rgba(8, 145, 178, 0.3);
          color: #0891b2;
        }

        .developer-badge.light:hover {
          background: rgba(8, 145, 178, 0.2);
          border-color: rgba(8, 145, 178, 0.5);
        }

        .footer-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.3), transparent);
          margin: 8px 0;
        }

        .footer-divider.light {
          background: linear-gradient(90deg, transparent, rgba(8, 145, 178, 0.2), transparent);
        }
      `}</style>

      <div className="footer-container light:footer-container.light">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Main footer content */}
          <div className="flex flex-col items-center justify-center gap-4">
            {/* App name and developer */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
              <span className="text-lg font-bold text-cyan-400 dark:text-cyan-300">
                🚀 Real-Time Collab Hub
              </span>
              <div className="developer-badge dark:developer-badge.light">
                <span>👨‍💻</span>
                <span>Developed by Himanshu Kumar</span>
              </div>
            </div>

            {/* Divider */}
            <div className="footer-divider dark:footer-divider.light w-full"></div>

            {/* Copyright text */}
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="copyright-text dark:copyright-text.light text-sm">
                © {currentYear} Himanshu Kumar. All rights reserved.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                A real-time collaboration platform for team project management
                and instant communication
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 italic">
                Made with ❤️ for seamless team collaboration
              </p>
            </div>

            {/* License info */}
            <div className="mt-2 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-600">
                Licensed under MIT • Version 1.0.0 • 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
