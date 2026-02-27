import { useState } from "react";
import { useRouter } from "next/router";
import API from "../services/api";
import Head from "next/head";

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

const PERKS = [
  { emoji: "⚡", text: "Set up a project in under 60 seconds" },
  { emoji: "🤝", text: "Invite teammates with a single link" },
  { emoji: "🤖", text: "AI Copilot included, no extra cost" },
  { emoji: "🔒", text: "Your data is encrypted end-to-end" },
];

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast("Please fill in all fields", "error");
      return;
    }
    if (form.password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    try {
      setLoading(true);
      await API.post("/auth/register", form);
      toast("Account created! Redirecting to login…", "success");
      setTimeout(() => router.push("/login"), 1200);
    } catch (error) {
      toast(
        error?.response?.data?.message ||
          "Registration failed. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Account &mdash; CollabHub</title>
      </Head>
      <style>{`
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
        @keyframes shimmer{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
        @keyframes spin-slow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        .lp-anim{animation:fadeUp 0.55s cubic-bezier(.4,0,.2,1) both;}
        .lp-anim-1{animation-delay:0.05s;}
        .lp-anim-2{animation-delay:0.13s;}
        .lp-anim-3{animation-delay:0.22s;}
        .lp-gradient-text{
          background:linear-gradient(135deg,#a78bfa 0%,#38bdf8 100%);
          -webkit-background-clip:text;background-clip:text;
          -webkit-text-fill-color:transparent;
          background-size:200% 200%;animation:shimmer 5s ease infinite;
        }
        .lp-ring{animation:spin-slow 20s linear infinite;}
      `}</style>
      <ToastContainer toasts={toasts} />

      <main className="lp-shell">
        <div className="lp-grid" />
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />
        <div className="lp-orb lp-orb-c" />

        <div className="lp-layout">
          {/* ── LEFT PANEL ── */}
          <section className="lp-left">
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

            <div className="lp-hero lp-anim lp-anim-2">
              <div className="lp-badge">
                <span className="lp-badge-dot" />
                Free to join
              </div>
              <h1 className="lp-headline">
                Start building.
                <br />
                <span className="lp-gradient-text">Together.</span>
              </h1>
              <p className="lp-subtext">
                Join thousands of students who use CollabHub to ship real
                projects — with tasks, live chat, file sharing, and AI
                assistance.
              </p>
            </div>

            <div className="lp-features lp-anim lp-anim-3">
              {PERKS.map((p) => (
                <div key={p.text} className="lp-feature">
                  <div className="lp-feature-icon" style={{ fontSize: "16px" }}>
                    {p.emoji}
                  </div>
                  <div className="lp-feature-title">{p.text}</div>
                </div>
              ))}
            </div>

            <div className="lp-deco-ring" aria-hidden>
              <svg viewBox="0 0 300 300" fill="none" className="lp-ring">
                <circle
                  cx="150"
                  cy="150"
                  r="140"
                  stroke="url(#rg2)"
                  strokeWidth="1.2"
                  strokeDasharray="8 14"
                />
                <defs>
                  <linearGradient id="rg2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </section>

          {/* ── RIGHT PANEL ── */}
          <section className="lp-right">
            <div className="lp-card">
              <div className="lp-card-accent" aria-hidden />
              <div className="lp-card-inner">
                <div className="lp-card-header lp-anim lp-anim-1">
                  <h2 className="lp-card-title">Create your account</h2>
                  <p className="lp-card-sub">
                    Get started in seconds — it&apos;s free
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="lp-anim lp-anim-2">
                  <div className="lp-field">
                    <label>Full Name</label>
                    <div className="lp-inp-wrap">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        autoComplete="name"
                      />
                    </div>
                  </div>

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

                  <div className="lp-field">
                    <label>Password</label>
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
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        autoComplete="new-password"
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

                  {/* Password strength hint */}
                  {form.password.length > 0 && (
                    <div className="lp-pw-hint">
                      <div className="lp-pw-bars">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className="lp-pw-bar"
                            style={{
                              background:
                                form.password.length >= n * 2 + 2
                                  ? n <= 2
                                    ? "#f43f5e"
                                    : n === 3
                                      ? "#f59e0b"
                                      : "#10b981"
                                  : "rgba(255,255,255,0.08)",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          color:
                            form.password.length < 6
                              ? "#f43f5e"
                              : form.password.length < 10
                                ? "#f59e0b"
                                : "#10b981",
                        }}
                      >
                        {form.password.length < 6
                          ? "Too short"
                          : form.password.length < 10
                            ? "Fair"
                            : "Strong"}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="lp-submit"
                    disabled={loading}
                    style={{ marginTop: "20px" }}
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
                        Creating account…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Create Account
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
                  Already have an account?{" "}
                  <button type="button" onClick={() => router.push("/login")}>
                    Sign in
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
