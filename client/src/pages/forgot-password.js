import { useState } from "react";
import { useRouter } from "next/router";
import API from "../services/api";
import Head from "next/head";

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.newPassword || !form.confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/forgot-password", {
        email: form.email.trim(),
        newPassword: form.newPassword
      });
      alert("Password reset successful. Please login.");
      router.push("/login");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Student Collab Hub - Reset Password</title>
      </Head>
      <main className="login-shell">
        <div className="grid-bg" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        <div className="layout">
          <section className="left">
            <div className="brand">
              <div className="brand-icon">S</div>
              <div className="brand-name">
                Student<span>Collab</span>Hub
              </div>
            </div>

            <div className="hero-text">
              <div className="hero-tag">Account recovery</div>
              <h1 className="hero-headline">
                Reset your
                <br />
                <em>password</em>
                <br />
                securely.
              </h1>
              <p className="hero-sub">
                Enter your email and set a new password to get back into your workspace.
              </p>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat-num">
                  12<span>k</span>
                </div>
                <div className="stat-label">Active students</div>
              </div>
              <div className="stat">
                <div className="stat-num">
                  3<span>.4k</span>
                </div>
                <div className="stat-label">Projects live</div>
              </div>
              <div className="stat">
                <div className="stat-num">
                  98<span>%</span>
                </div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
          </section>

          <section className="right">
            <div className="form-card">
              <div className="form-header">
                <h2 className="form-title">Forgot Password</h2>
                <p className="form-sub">Set a new password for your account</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Email address</label>
                  <div className="input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,12 2,6" />
                    </svg>
                    <input
                      type="email"
                      placeholder="you@university.edu"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>New Password</label>
                  <div className="input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Confirm Password</label>
                  <div className="input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary-login" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>

              <div className="signup-row">
                Back to{" "}
                <button type="button" onClick={() => router.push("/login")}>
                  Login
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

