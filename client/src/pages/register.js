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
    success: "border-emerald-500/40 bg-emerald-950/80 text-emerald-300",
    error: "border-rose-500/40 bg-rose-950/80 text-rose-300",
    info: "border-indigo-500/40 bg-indigo-950/80 text-indigo-300",
  };
  return (
    <div
      className="fixed right-5 top-5 z-[9999] flex flex-col gap-2"
      style={{ pointerEvents: "none" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md ${c[t.type] || c.info}`}
          style={{
            pointerEvents: "auto",
            animation: "toastIn 0.3s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {t.type === "success" && <span>✓</span>}
          {t.type === "error" && <span>✕</span>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

const PERKS = [
  { icon: "⚡", text: "Set up a project in under 60 seconds" },
  { icon: "🤝", text: "Invite teammates with a single link" },
  { icon: "🤖", text: "AI Copilot included, no extra cost" },
  { icon: "🔒", text: "Your data is encrypted end-to-end" },
];

function EyeIcon({ visible }) {
  return visible ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
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
      className="h-4 w-4"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

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

  const pwStrength =
    form.password.length === 0
      ? null
      : form.password.length < 6
        ? "weak"
        : form.password.length < 10
          ? "fair"
          : "strong";
  const strengthColor =
    { weak: "#f43f5e", fair: "#f59e0b", strong: "#10b981" }[pwStrength] ||
    "#334155";
  const strengthBars = { weak: 1, fair: 2, strong: 4 }[pwStrength] || 0;

  return (
    <>
      <Head>
        <title>Create Account — CollabHub</title>
      </Head>

      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes spinRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseDot { 0%,100%{opacity:.5;transform:scale(.9)} 50%{opacity:1;transform:scale(1.1)} }

        .auth-root {
          min-height:100vh;display:flex;
          background:#050d1f;
          font-family:'Inter','DM Sans',sans-serif;
          overflow:hidden;position:relative;
        }
        .auth-mesh {
          position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:
            linear-gradient(rgba(99,102,241,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,.05) 1px, transparent 1px);
          background-size:60px 60px;
        }
        .auth-blob { position:fixed;border-radius:50%;filter:blur(110px);z-index:0;pointer-events:none; }
        .auth-blob-1 { width:700px;height:700px;background:radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 70%);top:-250px;left:-200px; }
        .auth-blob-2 { width:500px;height:500px;background:radial-gradient(circle,rgba(139,92,246,.15) 0%,transparent 70%);bottom:-200px;right:-150px; }
        .auth-blob-3 { width:350px;height:350px;background:radial-gradient(circle,rgba(6,182,212,.1) 0%,transparent 70%);top:45%;left:38%; }

        .auth-layout {
          position:relative;z-index:1;
          display:grid;grid-template-columns:1.15fr 0.85fr;
          min-height:100vh;width:100%;
        }

        .auth-left {
          display:flex;flex-direction:column;
          padding:52px 64px;
          border-right:1px solid rgba(99,102,241,.15);
          position:relative;overflow:hidden;
          justify-content:space-between;
        }
        .auth-brand { display:flex;align-items:center;gap:11px;animation:fadeUp .5s .05s both; }
        .auth-brand-icon {
          width:38px;height:38px;border-radius:12px;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 20px rgba(99,102,241,.45);flex-shrink:0;
        }
        .auth-brand-name {
          font-family:'Plus Jakarta Sans','Syne',sans-serif;font-size:20px;font-weight:800;
          background:linear-gradient(135deg,#e2e8f0 0%,#a5b4fc 100%);
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
          letter-spacing:-0.02em;
        }
        .auth-hero { flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0; }
        .auth-badge {
          display:inline-flex;align-items:center;gap:8px;
          background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);
          border-radius:100px;padding:6px 14px;font-size:12px;font-weight:600;
          color:#a5b4fc;letter-spacing:.04em;text-transform:uppercase;
          width:fit-content;margin-bottom:28px;animation:fadeUp .5s .1s both;
        }
        .auth-badge-dot {
          width:7px;height:7px;border-radius:50%;
          background:#6366f1;box-shadow:0 0 8px #6366f1;
          animation:pulseDot 2s ease-in-out infinite;
        }
        .auth-headline {
          font-family:'Plus Jakarta Sans','Syne',sans-serif;
          font-size:clamp(36px,4vw,52px);font-weight:800;
          line-height:1.08;letter-spacing:-0.03em;
          color:#f1f5f9;margin-bottom:20px;animation:fadeUp .5s .18s both;
        }
        .auth-headline-accent {
          background:linear-gradient(135deg,#818cf8 0%,#c084fc 50%,#67e8f9 100%);
          background-size:200% 200%;animation:gradientShift 5s ease infinite;
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
        }
        .auth-subtext { font-size:15.5px;line-height:1.65;color:#94a3b8;max-width:400px;animation:fadeUp .5s .26s both; }
        .auth-features { display:flex;flex-direction:column;gap:10px;animation:fadeUp .5s .34s both;margin-top:36px; }
        .auth-feature {
          display:flex;align-items:center;gap:14px;
          background:rgba(15,23,42,.5);border:1px solid rgba(99,102,241,.12);
          border-radius:12px;padding:12px 16px;
          transition:border-color .2s,background .2s;
        }
        .auth-feature:hover { border-color:rgba(99,102,241,.3);background:rgba(99,102,241,.06); }
        .auth-feature-icon {
          width:34px;height:34px;border-radius:10px;flex-shrink:0;
          background:linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.15));
          border:1px solid rgba(99,102,241,.25);
          display:flex;align-items:center;justify-content:center;font-size:16px;
        }
        .auth-feature-text { font-size:13.5px;font-weight:500;color:#cbd5e1; }
        .auth-deco-ring {
          position:absolute;bottom:-120px;left:-80px;width:320px;height:320px;
          opacity:.25;pointer-events:none;z-index:0;
          animation:spinRing 25s linear infinite;
        }

        .auth-right { display:flex;align-items:center;justify-content:center;padding:40px 48px; }
        .auth-card {
          width:100%;max-width:420px;
          background:rgba(10,16,35,.85);border:1px solid rgba(99,102,241,.2);
          border-radius:28px;overflow:hidden;
          box-shadow:0 24px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.03);
          backdrop-filter:blur(24px);animation:fadeUp .5s .08s both;
        }
        .auth-card-bar {
          height:4px;
          background:linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4);
          background-size:200% 100%;animation:gradientShift 4s ease infinite;
        }
        .auth-card-body { padding:36px 36px 32px; }
        .auth-card-eyebrow { font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6366f1;margin-bottom:8px; }
        .auth-card-title {
          font-family:'Plus Jakarta Sans','Syne',sans-serif;
          font-size:26px;font-weight:800;color:#f1f5f9;letter-spacing:-0.025em;margin-bottom:6px;
        }
        .auth-card-sub { font-size:14px;color:#64748b;margin-bottom:28px; }

        .auth-field { margin-bottom:16px; }
        .auth-label { font-size:13px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:8px; }
        .auth-inp-wrap {
          display:flex;align-items:center;
          background:rgba(15,23,42,.7);border:1.5px solid rgba(51,65,85,.7);
          border-radius:14px;transition:border-color .2s,box-shadow .2s;overflow:hidden;
        }
        .auth-inp-wrap:focus-within {
          border-color:#6366f1;
          box-shadow:0 0 0 3px rgba(99,102,241,.18),0 0 20px rgba(99,102,241,.1);
        }
        .auth-inp-icon {
          display:flex;align-items:center;justify-content:center;
          width:44px;height:44px;flex-shrink:0;color:#475569;
        }
        .auth-inp-icon svg { width:16px;height:16px; }
        .auth-inp-wrap input {
          flex:1;background:transparent;border:none;outline:none;
          color:#f1f5f9;font-size:14px;font-family:inherit;
          padding:12px 4px 12px 0;min-width:0;
        }
        .auth-inp-wrap input::placeholder { color:#334155; }
        .auth-eye {
          width:42px;height:44px;display:flex;align-items:center;justify-content:center;
          background:transparent;border:none;cursor:pointer;color:#475569;
          flex-shrink:0;transition:color .2s;
        }
        .auth-eye:hover { color:#818cf8; }

        .auth-pw-strength { display:flex;align-items:center;gap:10px;margin-top:8px; }
        .auth-pw-bars { display:flex;gap:4px; }
        .auth-pw-bar { width:28px;height:3px;border-radius:99px;background:rgba(255,255,255,.08);transition:background .3s; }
        .auth-pw-label { font-size:11.5px;font-weight:600; }

        .auth-submit {
          width:100%;height:48px;border:none;cursor:pointer;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border-radius:14px;color:#fff;font-size:15px;font-weight:700;
          font-family:inherit;letter-spacing:.01em;
          box-shadow:0 8px 24px rgba(99,102,241,.4);
          transition:transform .2s,box-shadow .2s,opacity .2s;
          position:relative;overflow:hidden;margin-top:20px;
        }
        .auth-submit::before {
          content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
          transition:left .4s;
        }
        .auth-submit:hover:not(:disabled)::before { left:200%; }
        .auth-submit:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 12px 32px rgba(99,102,241,.5); }
        .auth-submit:active:not(:disabled) { transform:translateY(0); }
        .auth-submit:disabled { opacity:.6;cursor:not-allowed; }

        .auth-footer-row { margin-top:22px;text-align:center;font-size:13px;color:#475569; }
        .auth-footer-row button {
          background:transparent;border:none;cursor:pointer;
          font-size:13px;font-weight:600;color:#818cf8;
          font-family:inherit;padding:0;transition:color .2s;
        }
        .auth-footer-row button:hover { color:#a5b4fc; }

        @media(max-width:900px){
          .auth-layout{grid-template-columns:1fr;}
          .auth-left{display:none;}
          .auth-right{padding:24px 20px;}
        }
      `}</style>

      <ToastContainer toasts={toasts} />

      <div className="auth-root">
        <div className="auth-mesh" />
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />

        <div className="auth-layout">
          {/* ════ LEFT PANEL ════ */}
          <section className="auth-left">
            <div className="auth-brand">
              <div className="auth-brand-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="7" r="4" />
                  <path
                    d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="auth-brand-name">CollabHub</span>
            </div>

            <div className="auth-hero">
              <div className="auth-badge">
                <span className="auth-badge-dot" />
                Free to join
              </div>
              <h1 className="auth-headline">
                Start building.
                <br />
                <span className="auth-headline-accent">Together.</span>
              </h1>
              <p className="auth-subtext">
                Join thousands of students who use CollabHub to ship real
                projects — with tasks, live chat, file sharing, and AI
                assistance.
              </p>

              <div className="auth-features">
                {PERKS.map((p) => (
                  <div key={p.text} className="auth-feature">
                    <div className="auth-feature-icon">{p.icon}</div>
                    <div className="auth-feature-text">{p.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <svg className="auth-deco-ring" viewBox="0 0 320 320" fill="none">
              <circle
                cx="160"
                cy="160"
                r="150"
                stroke="url(#rg2)"
                strokeWidth="1"
                strokeDasharray="6 12"
              />
              <defs>
                <linearGradient id="rg2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </section>

          {/* ════ RIGHT PANEL ════ */}
          <section className="auth-right">
            <div className="auth-card">
              <div className="auth-card-bar" />
              <div className="auth-card-body">
                <div className="auth-card-eyebrow">Get started</div>
                <h2 className="auth-card-title">Create your account</h2>
                <p className="auth-card-sub">
                  Free forever — no credit card required
                </p>

                <form onSubmit={handleSubmit}>
                  {/* Name */}
                  <div className="auth-field">
                    <label className="auth-label">Full Name</label>
                    <div className="auth-inp-wrap">
                      <div className="auth-inp-icon">
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
                      </div>
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

                  {/* Email */}
                  <div className="auth-field">
                    <label className="auth-label">Email address</label>
                    <div className="auth-inp-wrap">
                      <div className="auth-inp-icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,12 2,6" />
                        </svg>
                      </div>
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
                  <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <div className="auth-inp-wrap">
                      <div className="auth-inp-icon">
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
                      </div>
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
                        className="auth-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label="Toggle"
                      >
                        <EyeIcon visible={showPassword} />
                      </button>
                    </div>
                    {pwStrength && (
                      <div className="auth-pw-strength">
                        <div className="auth-pw-bars">
                          {[1, 2, 3, 4].map((n) => (
                            <div
                              key={n}
                              className="auth-pw-bar"
                              style={{
                                background:
                                  n <= strengthBars
                                    ? strengthColor
                                    : "rgba(255,255,255,.08)",
                              }}
                            />
                          ))}
                        </div>
                        <span
                          className="auth-pw-label"
                          style={{ color: strengthColor }}
                        >
                          {pwStrength === "weak"
                            ? "Too short"
                            : pwStrength === "fair"
                              ? "Fair"
                              : "Strong"}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
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

                <div className="auth-footer-row">
                  Already have an account?{" "}
                  <button type="button" onClick={() => router.push("/login")}>
                    Sign in
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
