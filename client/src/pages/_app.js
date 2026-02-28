import "../styles/globals.css";
import "../styles/login.css";
import { useRouter } from "next/router";
import { ThemeProvider } from "../context/ThemeContext";
import { useEffect } from "react";

function usePWA() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);
}

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
      </div>
    </ThemeProvider>
  );
}
