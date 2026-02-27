import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "../services/api";
import Navbar from "../components/layout/Navbar";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    API.get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setProfileForm({
          name: res.data.user?.name || "",
          email: res.data.user?.email || "",
        });
      })
      .catch(() => router.push("/login"));
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      alert("Name and email are required");
      return;
    }

    try {
      const res = await API.put("/auth/profile", profileForm);
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Profile updated successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update profile");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      alert("Current and new password are required");
      return;
    }

    try {
      await API.put("/auth/password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      alert("Password changed successfully");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <main className="login-shell">
      <div className="layout dashboard-layout">
        <section className="left dashboard-left">
          <div className="brand">
            <div className="brand-icon">S</div>
            <div className="brand-name">
              Student<span>Collab</span>Hub
            </div>
          </div>

          <div className="hero-text">
            <div className="hero-tag">Account settings</div>
            <h1 className="hero-headline">
              Update
              <br />
              your <em>profile</em>
              <br />
              securely.
            </h1>
            <p className="hero-sub">
              Manage personal details and password to keep your account
              protected.
            </p>
          </div>
        </section>

        <section className="right dashboard-right">
          <div className="dashboard-content max-w-5xl">
            <Navbar title="Settings" showDashboard onLogout={logout} />

            <div className="panel-card mb-6 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-300">Account</p>
                  <p className="text-lg font-semibold text-white">
                    {user?.name}{" "}
                    <span className="text-cyan-300">({user?.role})</span>
                  </p>
                  <p className="text-sm text-slate-300">{user?.email}</p>
                </div>
                {user?.role === "admin" ? (
                  <button
                    className="btn-secondary"
                    onClick={() => router.push("/admin")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
                        <path d="M3 12l9 4.5 9-4.5" />
                        <path d="M3 16.5L12 21l9-4.5" />
                      </svg>
                      Admin Center
                    </span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="panel-card p-5">
              <div className="grid gap-6 xl:grid-cols-2">
                <form onSubmit={updateProfile} className="grid gap-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Profile
                  </h4>
                  <input
                    className="input-modern"
                    placeholder="Name"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                  />
                  <input
                    className="input-modern"
                    placeholder="Email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                  />
                  <button type="submit" className="btn-primary w-fit">
                    <span className="inline-flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M5 12l4 4L19 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Save Profile
                    </span>
                  </button>
                </form>

                <form onSubmit={changePassword} className="grid gap-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Password
                  </h4>
                  <input
                    type="password"
                    className="input-modern"
                    placeholder="Current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                  <input
                    type="password"
                    className="input-modern"
                    placeholder="New password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                  />
                  <button type="submit" className="btn-primary w-fit">
                    <span className="inline-flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                      </svg>
                      Change Password
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
