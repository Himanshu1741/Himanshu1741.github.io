import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import API from "../services/api";
import AppLayout from "../components/layout/AppLayout";

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "info") => {
    const id = Date.now(); setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, toast };
}
function ToastContainer({ toasts }) {
  const c = { success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", error: "border-rose-500/40 bg-rose-500/10 text-rose-300", info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300", warning: "border-amber-500/40 bg-amber-500/10 text-amber-300" };
  return (
    <div className="fixed right-5 top-5 z-[9999] flex flex-col gap-2" style={{ pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm ${c[t.type]}`} style={{ pointerEvents: "auto", animation: "slideInRight 0.25s ease" }}>{t.msg}</div>
      ))}
    </div>
  );
}

function SettingsSection({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-base">{icon}</div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { toasts, toast } = useToast();
  const router = useRouter();

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); };

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    API.get("/auth/me").then((res) => {
      setUser(res.data.user);
      setProfileForm({ name: res.data.user?.name || "", email: res.data.user?.email || "" });
    }).catch(() => router.push("/login"));
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) { toast("Name and email are required", "warning"); return; }
    setProfileLoading(true);
    try {
      const res = await API.put("/auth/profile", profileForm);
      setUser(res.data.user); localStorage.setItem("user", JSON.stringify(res.data.user));
      toast("Profile updated successfully!", "success");
    } catch (error) { toast(error?.response?.data?.message || "Failed to update profile", "error"); }
    finally { setProfileLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { toast("Both password fields are required", "warning"); return; }
    setPasswordLoading(true);
    try {
      await API.put("/auth/password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      toast("Password changed successfully!", "success");
    } catch (error) { toast(error?.response?.data?.message || "Failed to change password", "error"); }
    finally { setPasswordLoading(false); }
  };

  if (!user) return null;

  const initials = (user.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const GRADS = ["from-cyan-500 to-blue-500", "from-violet-500 to-purple-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500"];
  const avatarGrad = GRADS[initials.charCodeAt(0) % GRADS.length];

  return (
    <>
      <style>{`@keyframes slideInRight { from{opacity:0;transform:translateX(20px);} to{opacity:1;transform:translateX(0);} }`}</style>
      <ToastContainer toasts={toasts} />
      <AppLayout user={user} activeTab="settings" onLogout={logout}>
        <div className="space-y-6">
          {/* Profile overview card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-violet-500/8 blur-3xl" />
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-black text-white shadow-lg ${avatarGrad}`}>{initials}</div>
              <div>
                <h2 className="text-xl font-extrabold text-white">{user.name}</h2>
                <p className="text-sm text-slate-400">{user.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">{user.role}</span>
                  {user.role === "admin" && (
                    <button className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition" onClick={() => router.push("/admin")}>
                      Admin Center →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {/* Profile form */}
            <SettingsSection title="Update Profile" icon="👤">
              <form onSubmit={updateProfile} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Full Name</label>
                  <input className="input-modern" placeholder="Your full name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Email Address</label>
                  <input type="email" className="input-modern" placeholder="you@university.edu" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary" disabled={profileLoading}>
                  {profileLoading ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </SettingsSection>

            {/* Password form */}
            <SettingsSection title="Change Password" icon="🔑">
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">Current Password</label>
                  <input type="password" className="input-modern" placeholder="Enter current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">New Password</label>
                  <input type="password" className="input-modern" placeholder="Enter new password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </SettingsSection>
          </div>

          {/* Account details */}
          <SettingsSection title="Account Details" icon="ℹ">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Member since", value: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A" },
                { label: "Account role", value: user.role },
                { label: "Account ID", value: `#${user.id}` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600">{item.label}</p>
                  <p className="text-sm font-semibold capitalize text-slate-200">{item.value}</p>
                </div>
              ))}
            </div>
          </SettingsSection>

          {/* Danger zone */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">⚠</span>
              <h3 className="text-sm font-bold text-rose-300">Danger Zone</h3>
            </div>
            <p className="mb-4 text-xs text-slate-500">Signing out will end your current session and you will need to log in again.</p>
            <button className="btn-danger" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
