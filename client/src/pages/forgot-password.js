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

const STEPS = [
  { n: "01", label: "Enter your email" },
  { n: "02", label: "Provide a new password" },
  { n: "03", label: "Confirm and save" },
];

export default function ForgotPassword() {
  const [form, setForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toasts, toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.newPassword || !form.confirmPassword) {
      toast("Please fill in all fields", "error");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (form.newPassword.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    try {
      setLoading(true);
      await API.post("/auth/forgot-password", {
        email: form.email.trim(),
        newPassword: form.newPassword,
      });
      setDone(true);
      toast("Password reset successful!", "success");
      setTimeout(() => router.push("/login"), 2200);
    } catch (error) {
      toast(
        error?.response?.data?.message || "Failed to reset password",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const EyeBtn = ({ show, onToggle }) => (
    <button
      type="button"
      className="lp-eye"
      onClick={onToggle}
      aria-label="Toggle visibility"
    >
      {show ? (
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
          <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
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
  );

  return (
    <>
      <Head>
        <title>Reset Password &mdash; CollabHub</title>
      </Head>
      <style>{`
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
        @keyframes shimmer{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
        @keyframes spin-slow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes checkPop{0%{transform:scale(0);}70%{transform:scale(1.15);}100%{transform:scale(1);}}
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
        .lp-ring{animation:spin-slow 22s linear infinite;}
        .check-pop{animation:checkPop 0.5s cubic-bezier(.4,0,.2,1) both;}
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
                Account Recovery
              </div>
              <h1 className="lp-headline">
                Regain access.
                <br />
                <span className="lp-gradient-text">Stay secure.</span>
              </h1>
              <p className="lp-subtext">
                Reset your password in seconds. Your workspace will be waiting
                right where you left it.
              </p>
            </div>

            {/* Step list */}
            <div className="lp-features lp-anim lp-anim-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="lp-feature"
                  style={{ alignItems: "center" }}
                >
                  <div
                    className="lp-feature-icon"
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "#a78bfa",
                    }}
                  >
                    {s.n}
                  </div>
                  <div className="lp-feature-title" style={{ marginBottom: 0 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-deco-ring" aria-hidden>
              <svg viewBox="0 0 300 300" fill="none" className="lp-ring">
                <circle
                  cx="150"
                  cy="150"
                  r="140"
                  stroke="url(#rg3)"
                  strokeWidth="1.2"
                  strokeDasharray="8 14"
                />
                <defs>
                  <linearGradient id="rg3" x1="0" y1="0" x2="1" y2="1">
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
                {done ? (
                  /* ── Success state ── */
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div
                      className="check-pop"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                        boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.5"
                        style={{ width: 28, height: 28 }}
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h2 className="lp-card-title">Password Reset!</h2>
                    <p className="lp-card-sub" style={{ marginTop: 8 }}>
                      Redirecting you to sign in…
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="lp-card-header lp-anim lp-anim-1">
                      <h2 className="lp-card-title">Reset your password</h2>
                      <p className="lp-card-sub">
                        Enter your email and choose a new password below
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="lp-anim lp-anim-2">
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
                        <label>New Password</label>
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
                            type={showNew ? "text" : "password"}
                            placeholder="Min. 6 characters"
                            value={form.newPassword}
                            onChange={(e) =>
                              setForm({ ...form, newPassword: e.target.value })
                            }
                          />
                          <EyeBtn
                            show={showNew}
                            onToggle={() => setShowNew((v) => !v)}
                          />
                        </div>
                      </div>

                      <div className="lp-field">
                        <label>Confirm Password</label>
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
                            type={showConfirm ? "text" : "password"}
                            placeholder="Repeat new password"
                            value={form.confirmPassword}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                confirmPassword: e.target.value,
                              })
                            }
                          />
                          <EyeBtn
                            show={showConfirm}
                            onToggle={() => setShowConfirm((v) => !v)}
                          />
                        </div>
                        {/* Match indicator */}
                        {form.confirmPassword.length > 0 && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 11.5,
                              fontWeight: 600,
                              color:
                                form.newPassword === form.confirmPassword
                                  ? "#10b981"
                                  : "#f43f5e",
                            }}
                          >
                            {form.newPassword === form.confirmPassword
                              ? "✓ Passwords match"
                              : "✗ Passwords do not match"}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="lp-submit"
                        disabled={loading}
                        style={{ marginTop: "8px" }}
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
                            Resetting…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Reset Password
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
                      Remembered it?{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/login")}
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
