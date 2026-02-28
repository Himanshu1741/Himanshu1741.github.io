import "../styles/globals.css";
import "../styles/login.css";
import { useRouter } from "next/router";
import { ThemeProvider } from "../context/ThemeContext";
import { useEffect, useState } from "react";

// ─── Register service worker ──────────────────────────────────────────────────
function usePWA() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
        })
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);
}

// ─── Offline / Online banner ──────────────────────────────────────────────────
function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline(false);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 3500);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    // Check initial state
    if (!navigator.onLine) setOffline(true);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline && !showBack) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl transition-all ${
        offline
          ? "bg-slate-900 text-rose-400 border border-rose-500/30"
          : "bg-emerald-600 text-white border border-emerald-400/30"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          offline ? "bg-rose-500 animate-pulse" : "bg-white"
        }`}
      />
      {offline ? "You're offline — viewing cached content" : "✓ Back online"}
    </div>
  );
}

// ─── PWA Install prompt ───────────────────────────────────────────────────────
function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem("pwa-dismissed")) {
      setDismissed(true);
      return;
    }
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  };

  const dismiss = () => {
    sessionStorage.setItem("pwa-dismissed", "1");
    setDismissed(true);
    setPrompt(null);
  };

  if (!prompt || dismissed) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[9998] flex w-72 flex-col gap-3 rounded-2xl border border-violet-500/30 bg-slate-900 p-4 shadow-2xl shadow-violet-500/10">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="h-10 w-10 rounded-xl"
        />
        <div>
          <p className="text-sm font-bold text-white">Install CollabHub</p>
          <p className="text-xs text-slate-400">
            Add to your home screen for offline access and faster loading.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={install}
          className="flex-1 rounded-xl bg-violet-500 py-2 text-xs font-bold text-white transition hover:bg-violet-600"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 transition hover:bg-slate-800"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App({ Component, pageProps }) {
  const router = useRouter();
  usePWA();
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(
    router.pathname,
  );

  return (
    <ThemeProvider>
      <div className="app-shell">
        {!isAuthPage ? (
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="grid-bg" />
            <div className="orb orb-1" />
            <div className="orb orb-2" />
          </div>
        ) : null}
        <Component {...pageProps} />
        <OfflineBanner />
        <InstallBanner />
      </div>
    </ThemeProvider>
  );
}
