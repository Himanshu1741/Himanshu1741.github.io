// STUDENT PROFILE PAGE
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import AppLayout from "../components/layout/AppLayout";
import API from "../services/api";

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function memberSince(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

const GRADS = [
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

function userGrad(name = "") {
  return GRADS[name.charCodeAt(0) % GRADS.length];
}

/* ─── Toast ─────────────────────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}
function ToastContainer({ toasts }) {
  const c = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
  };
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${c[t.type] || c.info}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── Stat tile ─────────────────────────────────────────────────────────────── */
function StatTile({ icon, label, value, color }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-2xl border p-4 ${color}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xl font-extrabold">{value ?? "—"}</span>
      <span className="text-center text-[11px] font-bold uppercase tracking-wide opacity-70">
        {label}
      </span>
    </div>
  );
}

/* ─── Achievement Badge ─────────────────────────────────────────────────────── */
function Badge({ icon, label, earned }) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition ${
        earned
          ? "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300"
          : "border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700"
      }`}
    >
      <span className={`text-2xl ${!earned ? "grayscale opacity-30" : ""}`}>
        {icon}
      </span>
      <span className="text-center text-[10px] font-bold uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/* ─── Progress Ring ─────────────────────────────────────────────────────────── */
function ProgressRing({ percent }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = ((percent || 0) / 100) * circ;
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      className="rotate-[-90deg]"
    >
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="10"
        className="stroke-slate-200 dark:stroke-slate-700"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="10"
        stroke="url(#rgrad)"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 0.7s ease" }}
      />
      <defs>
        <linearGradient id="rgrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", skills: "" });
  const [saving, setSaving] = useState(false);
  const { toasts, add: toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) {
      router.push("/login");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      router.push("/login");
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/auth/stats");
      setStats(res.data);
      const u = res.data.user;
      setForm({ name: u.name || "", bio: u.bio || "", skills: u.skills || "" });
      // keep localStorage in sync
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...stored,
          name: u.name,
          bio: u.bio,
          skills: u.skills,
        }),
      );
    } catch {
      toast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Name is required", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await API.put("/auth/profile", {
        name: form.name.trim(),
        bio: form.bio.trim(),
        skills: form.skills.trim(),
      });
      const updated = res.data.user;
      setStats((s) => ({ ...s, user: { ...s.user, ...updated } }));
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, name: updated.name }),
      );
      setUser((u) => ({ ...u, name: updated.name }));
      setEditing(false);
      toast("Profile updated!", "success");
    } catch (err) {
      toast(err?.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // Derived achievements from stats
  const achievements = stats
    ? [
        {
          icon: "🚀",
          label: "First Task",
          earned: (stats.stats?.tasksAssigned ?? 0) >= 1,
        },
        {
          icon: "✅",
          label: "Finisher",
          earned: (stats.stats?.tasksCompleted ?? 0) >= 5,
        },
        {
          icon: "🤝",
          label: "Team Player",
          earned: (stats.stats?.projectCount ?? 0) >= 3,
        },
        {
          icon: "⚡",
          label: "On-Time Streak",
          earned: (stats.stats?.completionRate ?? 0) >= 80,
        },
        {
          icon: "🏆",
          label: "Project Lead",
          earned: (stats.stats?.projectCount ?? 0) >= 5,
        },
        {
          icon: "🌟",
          label: "All Clear",
          earned:
            (stats.stats?.tasksOverdue ?? 1) === 0 &&
            (stats.stats?.tasksAssigned ?? 0) > 0,
        },
      ]
    : [];

  const grad = userGrad(user?.name || "");

  if (!user) return null;

  return (
    <>
      <ToastContainer toasts={toasts} />
      <AppLayout user={user} activeTab="profile" onLogout={logout}>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* ── Profile card ── */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80">
            {/* Gradient banner */}
            <div className={`h-24 bg-gradient-to-r ${grad} opacity-80`} />

            <div className="relative px-6 pb-6">
              {/* Avatar */}
              <div
                className={`-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br text-2xl font-extrabold text-white shadow-lg ${grad} dark:border-slate-900`}
              >
                {initials(stats?.user?.name || user.name)}
              </div>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {stats?.user?.name || user.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {stats?.user?.email || user.email}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full border border-violet-400/30 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                      {stats?.user?.role || user.role}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Member since {memberSince(stats?.user?.created_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-400 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                  ✏️ Edit Profile
                </button>
              </div>

              {/* Bio */}
              {stats?.user?.bio && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {stats.user.bio}
                </p>
              )}

              {/* Skills */}
              {stats?.user?.skills && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {stats.user.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((sk) => (
                      <span
                        key={sk}
                        className="rounded-full border border-cyan-300/40 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                      >
                        {sk}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Stats ── */}
          {loading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <StatTile
                icon="📁"
                label="Projects"
                value={stats?.stats?.projectCount}
                color="border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              />
              <StatTile
                icon="📋"
                label="Assigned"
                value={stats?.stats?.tasksAssigned}
                color="border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              />
              <StatTile
                icon="✅"
                label="Completed"
                value={stats?.stats?.tasksCompleted}
                color="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
              />
              <StatTile
                icon="⚙️"
                label="In Progress"
                value={stats?.stats?.tasksInProgress}
                color="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
              />
              <StatTile
                icon="🔴"
                label="Overdue"
                value={stats?.stats?.tasksOverdue}
                color={`border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 ${(stats?.stats?.tasksOverdue ?? 0) > 0 ? "ring-2 ring-red-400/30" : ""}`}
              />
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-500/20 dark:bg-violet-500/10">
                <div className="relative flex items-center justify-center">
                  <ProgressRing percent={stats?.stats?.completionRate} />
                  <span
                    className="absolute text-base font-extrabold text-violet-700 dark:text-violet-300"
                    style={{ transform: "rotate(90deg)" }}
                  >
                    {stats?.stats?.completionRate ?? 0}%
                  </span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400 opacity-80">
                  Rate
                </span>
              </div>
            </div>
          )}

          {/* ── Achievements ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              🏅 Achievements
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {achievements.map((a) => (
                <Badge key={a.label} {...a} />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-600">
              Earned {achievements.filter((a) => a.earned).length} /{" "}
              {achievements.length} badges
            </p>
          </div>

          {/* ── Edit modal ── */}
          {editing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                <h3 className="mb-4 text-base font-bold text-white">
                  Edit Profile
                </h3>
                <form onSubmit={saveProfile} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                      Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                      Bio
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bio: e.target.value }))
                      }
                      placeholder="Tell your team a bit about yourself…"
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition resize-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                      Skills{" "}
                      <span className="text-slate-500">(comma-separated)</span>
                    </label>
                    <input
                      value={form.skills}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, skills: e.target.value }))
                      }
                      placeholder="React, Node.js, SQL, Design…"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-violet-500 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 transition"
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
