import { useState } from "react";
import API from "../services/api";
import { useRouter } from "next/router";
import Head from "next/head";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
  : "http://localhost:5000";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // OAuth: register page also redirects to backend OAuth (it will create account if new)
  const handleSocialLogin = (provider) => {
    const socialAuthUrls = {
      google:
        process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL ||
        `${BACKEND_URL}/api/auth/google`,
      github:
        process.env.NEXT_PUBLIC_GITHUB_AUTH_URL ||
        `${BACKEND_URL}/api/auth/github`,
    };
    const targetUrl = socialAuthUrls[provider];
    if (!targetUrl) return;
    window.location.assign(targetUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/register", form);
      alert("Registered successfully");
      router.push("/login");
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Student Collab Hub - Register</title>
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
              <div className="hero-tag">Create your workspace</div>
              <h1 className="hero-headline">
                Join your
                <br />
                <em>team</em> and
                <br />
                build faster.
              </h1>
              <p className="hero-sub">
                Register to collaborate on projects, track tasks, share files,
                and communicate in real time.
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
                <h2 className="form-title">Create your account</h2>
                <p className="form-sub">Start collaborating with your team</p>
              </div>

              <div className="social-row">
                <button
                  type="button"
                  className="social-btn"
                  onClick={() => handleSocialLogin("google")}
                >
                  Google
                </button>
                <button
                  type="button"
                  className="social-btn"
                  onClick={() => handleSocialLogin("github")}
                >
                  GitHub
                </button>
              </div>

              <div className="divider">or continue with email</div>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Full name</label>
                  <div className="input-wrap">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21a8 8 0 10-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Your full name"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Email address</label>
                  <div className="input-wrap">
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
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="input-wrap">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a18.47 18.47 0 015.06-5.94" />
                          <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
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

                <button
                  type="submit"
                  className="btn-primary-login"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>

              <div className="signup-row">
                Already have an account?{" "}
                <button type="button" onClick={() => router.push("/login")}>
                  Sign in
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
