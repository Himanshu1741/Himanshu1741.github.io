/**
 * Student Profile Page
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import API from "../services/api";

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
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", skills: "" });
  const [saving, setSaving] = useState(false);
  const { toasts, add: toast } = useToast();

  // Mount effect - runs only on client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

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
  }, [mounted, router]);

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

  const logout = useCallback(async () => {
    try {
      console.log("👋 Logging out...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("email");
      setUser(null);
      console.log("✅ Logout successful");
      setTimeout(() => {
        router.push("/login").catch((err) => {
          console.error("❌ Navigation error:", err);
          window.location.href = "/login";
        });
      }, 100);
    } catch (err) {
      console.error("❌ Logout error:", err);
      window.location.href = "/login";
    }
  }, [router]);

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

  if (!user || !mounted) return null;

  // Calculate profile completion
  const profileCompletion = stats
    ? [
        stats.user?.name ? 25 : 0,
        stats.user?.bio ? 25 : 0,
        stats.user?.skills ? 25 : 0,
        stats.user?.role ? 25 : 0,
      ].reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      <ToastContainer toasts={toasts} />
      <AppLayout user={user} activeTab="profile" onLogout={logout}>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* ── Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-500/8 blur-3xl" />
            <div className="absolute right-32 -bottom-8 h-28 w-28 rounded-full bg-violet-500/8 blur-3xl" />
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-500">
              Personal Profile
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Your Professional Profile
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage your profile, track your achievements, and showcase your
              work.
            </p>
          </div>

          {/* ── Profile card ── */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            {/* Gradient banner */}
            <div className={`h-32 bg-gradient-to-r ${grad} opacity-70`} />

            <div className="relative px-6 pb-8">
              {/* Avatar */}
              <div
                className={`-mt-14 flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-slate-900 bg-gradient-to-br text-4xl font-extrabold text-white shadow-lg ${grad}`}
              >
                {initials(stats?.user?.name || user.name)}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-white">
                    {stats?.user?.name || user.name}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {stats?.user?.email || user.email}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-300">
                      {stats?.user?.role || user.role}
                    </span>
                    <span className="text-xs text-slate-500">
                      📅 Member since {memberSince(stats?.user?.created_at)}
                    </span>
                  </div>
                  {stats?.user?.bio && (
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
                      {stats.user.bio}
                    </p>
                  )}
                  {stats?.user?.skills && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stats.user.skills
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((sk) => (
                          <span
                            key={sk}
                            className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300"
                          >
                            {sk}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-violet-500/50 hover:scale-105 transition duration-300 whitespace-nowrap"
                >
                  ✏️ Edit Profile
                </button>
              </div>

              {/* Profile completion bar */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Profile Completion
                  </span>
                  <span className="text-xs font-bold text-cyan-400">
                    {profileCompletion}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Your Stats
            </h3>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-xl bg-slate-800"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
                  {/* Projects */}
                  <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800 to-slate-900 p-4 hover:border-slate-700 transition">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/8 rounded-full blur-2xl group-hover:bg-blue-500/15 transition" />
                    <div className="relative">
                      <p className="text-3xl font-bold text-white">
                        {stats?.stats?.projectCount || 0}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        📁 Projects
                      </p>
                    </div>
                  </div>

                  {/* Tasks Assigned */}
                  <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800 to-slate-900 p-4 hover:border-slate-700 transition">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-500/8 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition" />
                    <div className="relative">
                      <p className="text-3xl font-bold text-white">
                        {stats?.stats?.tasksAssigned || 0}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        📋 Assigned
                      </p>
                    </div>
                  </div>

                  {/* Tasks Completed */}
                  <div className="group relative overflow-hidden rounded-xl border border-emerald-800/50 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-4 hover:border-emerald-700 transition">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/15 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition" />
                    <div className="relative">
                      <p className="text-3xl font-bold text-emerald-400">
                        {stats?.stats?.tasksCompleted || 0}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        ✅ Completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                  {/* In Progress */}
                  <div className="group relative overflow-hidden rounded-xl border border-blue-800/50 bg-gradient-to-br from-blue-500/10 to-slate-900 p-4 hover:border-blue-700 transition">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/15 rounded-full blur-2xl group-hover:bg-blue-500/25 transition" />
                    <div className="relative">
                      <p className="text-3xl font-bold text-blue-400">
                        {stats?.stats?.tasksInProgress || 0}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        ⚙️ In Progress
                      </p>
                    </div>
                  </div>

                  {/* Overdue */}
                  <div
                    className={`group relative overflow-hidden rounded-xl border transition p-4 ${
                      (stats?.stats?.tasksOverdue ?? 0) > 0
                        ? "border-red-800/50 bg-gradient-to-br from-red-500/10 to-slate-900 hover:border-red-700"
                        : "border-slate-800 bg-gradient-to-br from-slate-800 to-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0 right-0 h-24 w-24 rounded-full blur-2xl transition ${
                        (stats?.stats?.tasksOverdue ?? 0) > 0
                          ? "bg-red-500/15 group-hover:bg-red-500/25"
                          : "bg-slate-600/8 group-hover:bg-slate-600/15"
                      }`}
                    />
                    <div className="relative">
                      <p
                        className={`text-3xl font-bold ${(stats?.stats?.tasksOverdue ?? 0) > 0 ? "text-red-400" : "text-slate-300"}`}
                      >
                        {stats?.stats?.tasksOverdue || 0}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        🔴 Overdue
                      </p>
                    </div>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="rounded-xl border border-violet-800/50 bg-gradient-to-br from-violet-500/10 to-slate-900 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-extrabold text-violet-400">
                        {stats?.stats?.completionRate ?? 0}%
                      </p>
                      <p className="text-sm font-semibold text-slate-400 mt-1">
                        Task Completion Rate
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {Math.round(
                          ((stats?.stats?.tasksCompleted ?? 0) /
                            Math.max(stats?.stats?.tasksAssigned ?? 1, 1)) *
                            100,
                        )}
                        % of assigned tasks completed
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <ProgressRing percent={stats?.stats?.completionRate} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Achievements ── */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  🏅 Achievements
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Earned{" "}
                  <span className="font-semibold text-cyan-400">
                    {achievements.filter((a) => a.earned).length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">{achievements.length}</span>{" "}
                  badges
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-cyan-400">
                  {Math.round(
                    (achievements.filter((a) => a.earned).length /
                      achievements.length) *
                      100,
                  )}
                  %
                </p>
                <p className="text-xs text-slate-500 mt-1">Complete</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {achievements.map((a) => (
                <div
                  key={a.label}
                  className={`group flex flex-col items-center gap-2 rounded-lg p-3 border transition ${
                    a.earned
                      ? "border-yellow-600/60 bg-gradient-to-br from-yellow-500/15 to-slate-900 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <span
                    className={`text-3xl transition ${!a.earned ? "grayscale opacity-40" : "group-hover:scale-110"}`}
                  >
                    {a.icon}
                  </span>
                  <span
                    className={`text-center text-xs font-bold uppercase tracking-wide ${
                      a.earned ? "text-yellow-300" : "text-slate-500"
                    }`}
                  >
                    {a.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Edit modal ── */}
          {editing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
                <h3 className="mb-2 text-xl font-bold text-white">
                  Edit Profile
                </h3>
                <p className="mb-6 text-sm text-slate-400">
                  Update your profile information
                </p>
                <form onSubmit={saveProfile} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-300">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      autoFocus
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-300">
                      Bio
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bio: e.target.value }))
                      }
                      placeholder="Tell your team about yourself…"
                      rows={3}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition resize-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-300">
                      Skills{" "}
                      <span className="text-slate-500 font-normal">
                        (comma-separated)
                      </span>
                    </label>
                    <input
                      value={form.skills}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, skills: e.target.value }))
                      }
                      placeholder="React, Node.js, SQL, Design…"
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition"
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
