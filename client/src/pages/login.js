import { useEffect, useState } from "react";
import API from "../services/api";
import { useRouter } from "next/router";
import Head from "next/head";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
  : "http://localhost:5000";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Handle OAuth redirect callback: /login?token=...&user=...
  useEffect(() => {
    const { token, user, error } = router.query;
    if (error) {
      const msg = error.includes("not_configured")
        ? "Social login is not configured yet. Please use email & password."
        : `Social login failed. Please try again. (${error})`;
      alert(msg);
      router.replace("/login", undefined, { shallow: true });
      return;
    }
    if (token && user) {
      try {
        const parsed = JSON.parse(decodeURIComponent(user));
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(parsed));
        if (parsed?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } catch {
        alert("OAuth login failed. Please try again.");
        router.replace("/login", undefined, { shallow: true });
      }
      return;
    }
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setForm((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, [router.query]);

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
    if (!form.email.trim() || !form.password.trim()) {
      alert("Please enter email and password");
      return;
    }
    try {
      setLoading(true);
      // Prevent stale session from a previously logged-in account.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const res = await API.post("/auth/login", { ...form, rememberMe });
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email.trim());
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      localStorage.setItem("token", res.data.token);
      // Validate token immediately to avoid redirect loop on dashboard.
      const meRes = await API.get("/auth/me");
      const validatedUser = meRes?.data?.user || res.data.user;
      localStorage.setItem("user", JSON.stringify(validatedUser));
      if (validatedUser?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error?.request && !error?.response
          ? "Cannot connect to backend server. Please make sure server is running."
          : null) ||
        "Login failed. Please try again.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Head>
        <title>Student Collab Hub - Sign In</title>
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
              <div className="hero-tag">Now in public beta</div>
              <h1 className="hero-headline">
                Where ideas
                <br />
                <em>meet</em> and
                <br />
                teams thrive.
              </h1>
              <p className="hero-sub">
                A workspace built for students. Brainstorm, collaborate on
                projects, share resources, and ship together.
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
                <h2 className="form-title">Welcome back</h2>
                <p className="form-sub">Sign in to continue to your hub</p>
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
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                <div className="row-inline">
                  <label className="checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="forgot"
                    onClick={() => router.push("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  className="btn-primary-login"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              <div className="signup-row">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => router.push("/register")}>
                  Create one - it&apos;s free
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
