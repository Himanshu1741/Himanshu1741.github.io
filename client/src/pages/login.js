import { useState } from "react";
import { useRouter } from "next/router";
import API from "../services/api";
import Head from "next/head";
import Link from "next/link";

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (msg, type = "error") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  return { toasts, toast };
}

function ToastContainer({ toasts }) {
  const c = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    info: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  };
  return (
    <div
      className="fixed right-5 top-5 z-[9999] flex flex-col gap-2"
      style={{ pointerEvents: "none" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm ${c[t.type] || c.info}`}
          style={{
            pointerEvents: "auto",
            animation: "slideInRight 0.25s ease",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

const FEATURES = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="7" r="4" />
        <path
          d="M23 21v-2a4 4 0 0 0-3-3.87"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 3.13a4 4 0 0 1 0 7.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Real-time Collaboration",
    desc: "Work together with your team simultaneously — see changes as they happen.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Smart Task Management",
    desc: "Kanban boards, milestones, and AI-powered task insights all in one place.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <polyline
          points="22 12 18 12 15 21 9 3 6 12 2 12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Instant Analytics",
    desc: "Visual reports, contribution stats, and GitHub integration at a glance.",
  },
];

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      toast("Please fill in all fields", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.user?.role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } catch (error) {
      toast(
        error?.response?.data?.message ||
          "Login failed. Check your credentials.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In &mdash; CollabHub</title>
      </Head>
      <style>{`
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
        @keyframes shimmer{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
        @keyframes spin-slow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes pulse-glow{0%,100%{opacity:.4;}50%{opacity:.9;}}
        .lp-anim{animation:fadeUp 0.55s cubic-bezier(.4,0,.2,1) both;}
        .lp-anim-1{animation-delay:0.05s;}
        .lp-anim-2{animation-delay:0.13s;}
        .lp-anim-3{animation-delay:0.22s;}
        .lp-anim-4{animation-delay:0.31s;}
        .lp-gradient-text{
          background:linear-gradient(135deg,#a78bfa 0%,#38bdf8 100%);
          background-clip:text;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-size:200% 200%;
          animation:shimmer 5s ease infinite;
        }
        .lp-ring{animation:spin-slow 18s linear infinite;}
        .lp-dot-pulse{animation:pulse-glow 2.2s ease-in-out infinite;}
      `}</style>
      <ToastContainer toasts={toasts} />

      <main className="lp-shell">
        {/* Backgrounds */}
        <div className="lp-grid" />
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />
        <div className="lp-orb lp-orb-c" />

        <div className="lp-layout">
          {/* ── LEFT PANEL ── */}
          <section className="lp-left">
            {/* Brand */}
            <div className="lp-brand lp-anim lp-anim-1">
              <div className="lp-brand-mark">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="h-4 w-4"
                >
                  <path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="7" r="4" />
                  <path
                    d="M23 21v-2a4 4 0 0 0-3-3.87"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 3.13a4 4 0 0 1 0 7.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="lp-brand-name">
                Collab<span>Hub</span>
              </span>
            </div>

            {/* Hero text */}
            <div className="lp-hero lp-anim lp-anim-2">
              <div className="lp-badge">
                <span className="lp-badge-dot lp-dot-pulse" />
                Built for student teams
              </div>
              <h1 className="lp-headline">
                One workspace.
                <br />
                <span className="lp-gradient-text">Infinite ideas.</span>
              </h1>
              <p className="lp-subtext">
                Bring your team together with tasks, live chat, file sharing,
                milestones, and AI-powered insights — all in one place.
              </p>
            </div>

            {/* Features */}
            <div className="lp-features lp-anim lp-anim-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="lp-feature">
                  <div className="lp-feature-icon">{f.icon}</div>
                  <div>
                    <div className="lp-feature-title">{f.title}</div>
                    <div className="lp-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative spinning ring */}
            <div className="lp-deco-ring" aria-hidden>
              <svg viewBox="0 0 300 300" fill="none" className="lp-ring">
                <circle
                  cx="150"
                  cy="150"
                  r="140"
                  stroke="url(#ring-grad)"
                  strokeWidth="1.2"
                  strokeDasharray="8 14"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="100"
                  stroke="url(#ring-grad2)"
                  strokeWidth="0.8"
                  strokeDasharray="4 18"
                  opacity="0.5"
                />
                <defs>
                  <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="ring-grad2" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity="0.05"
                    />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </section>

          {/* ── RIGHT PANEL ── */}
          <section className="lp-right">
            <div className="lp-card">
              {/* Card top accent */}
              <div className="lp-card-accent" aria-hidden />

              <div className="lp-card-inner">
                {/* Header */}
                <div className="lp-card-header lp-anim lp-anim-1">
                  <h2 className="lp-card-title">Welcome back</h2>
                  <p className="lp-card-sub">
                    Sign in to continue to your workspace
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="lp-anim lp-anim-2">
                  {/* Email */}
                  <div className="lp-field">
                    <label>Email address</label>
                    <div className="lp-inp-wrap">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,12 2,6" />
                      </svg>
                      <input
                        type="email"
                        placeholder="you@university.edu"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="lp-field">
                    <div className="lp-label-row">
                      <label>Password</label>
                      <Link href="/forgot-password" className="lp-forgot">
                        Forgot?
                      </Link>
                    </div>
                    <div className="lp-inp-wrap">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="lp-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <line
                              x1="1"
                              y1="1"
                              x2="23"
                              y2="23"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    type="submit"
                    className="lp-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                            strokeLinecap="round"
                          />
                        </svg>
                        Signing in…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Sign In
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="h-4 w-4"
                        >
                          <path
                            d="M5 12h14M12 5l7 7-7 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                </form>

                <div className="lp-register-row lp-anim lp-anim-3">
                  New to CollabHub?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                  >
                    Create a free account
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
