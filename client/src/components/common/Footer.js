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
          border-top: 3px solid rgba(34, 211, 238, 0.3);
          box-shadow: 0 -4px 20px rgba(34, 211, 238, 0.1);
        }

        .footer-container.light {
          background: linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.95) 100%);
          border-top: 3px solid rgba(8, 145, 178, 0.3);
          box-shadow: 0 -4px 20px rgba(8, 145, 178, 0.08);
        }

        .copyright-text {
          background: linear-gradient(90deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
          letter-spacing: 0.5px;
          font-size: 16px;
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
          gap: 8px;
          padding: 6px 16px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          background: rgba(34, 211, 238, 0.12);
          border: 1.5px solid rgba(34, 211, 238, 0.4);
          color: #22d3ee;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(34, 211, 238, 0.1);
        }

        .developer-badge:hover {
          background: rgba(34, 211, 238, 0.25);
          border-color: rgba(34, 211, 238, 0.6);
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(34, 211, 238, 0.2);
        }

        .developer-badge.light {
          background: rgba(8, 145, 178, 0.12);
          border: 1.5px solid rgba(8, 145, 178, 0.4);
          color: #0891b2;
          box-shadow: 0 4px 12px rgba(8, 145, 178, 0.08);
        }

        .developer-badge.light:hover {
          background: rgba(8, 145, 178, 0.25);
          border-color: rgba(8, 145, 178, 0.6);
          box-shadow: 0 8px 20px rgba(8, 145, 178, 0.15);
        }

        .footer-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.4), transparent);
          margin: 12px 0;
        }

        .footer-divider.light {
          background: linear-gradient(90deg, transparent, rgba(8, 145, 178, 0.3), transparent);
        }

        .footer-app-name {
          font-size: 22px;
          font-weight: 800;
          background: linear-gradient(90deg, #22d3ee 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .footer-app-name.light {
          background: linear-gradient(90deg, #0891b2 0%, #0284c7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="footer-container light:footer-container.light">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Main footer content */}
          <div className="flex flex-col items-center justify-center gap-6">
            {/* App name and developer */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
              <span className="footer-app-name dark:footer-app-name.light">
                🚀 Real-Time Collab Hub
              </span>
              <div className="developer-badge dark:developer-badge.light">
                <span className="text-lg">👨‍💻</span>
                <span>Developed by Himanshu Kumar</span>
              </div>
            </div>

            {/* Divider */}
            <div className="footer-divider dark:footer-divider.light w-full max-w-2xl"></div>

            {/* Copyright text */}
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="copyright-text dark:copyright-text.light">
                © {currentYear} Himanshu Kumar. All rights reserved.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                A real-time collaboration platform for team project management
                and instant communication
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Made with ❤️ for seamless team collaboration
              </p>
            </div>

            {/* License info */}
            <div className="mt-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-500 font-medium tracking-wide">
                📜 Licensed under MIT • Version 1.0.0 • © 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
