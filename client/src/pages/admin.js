import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import API from "../services/api";
import Navbar from "../components/layout/Navbar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), {
  ssr: false,
});
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), {
  ssr: false,
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Badge({ children, color }) {
  const map = {
    red: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    blue: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    slate: "bg-slate-700/50 text-slate-400 border-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[color] || map.slate}`}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value ?? 0}</p>
    </div>
  );
}

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(148,163,184,0.08)" },
    },
    y: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(148,163,184,0.08)" },
    },
  },
};

const LINE_OPTS = {
  ...CHART_OPTS,
  plugins: { legend: { display: true, labels: { color: "#94a3b8" } } },
};

// ─── Action button ─────────────────────────────────────────────────────────
function ActionBtn({ onClick, variant = "secondary", disabled, children }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40";
  const styles = {
    secondary:
      "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700",
    danger:
      "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
    success:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
    amber:
      "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
    primary:
      "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
  };
  return (
    <button
      className={`${base} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk selection
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Announcement
  const [announcement, setAnnouncement] = useState("");
  const [announcingStatus, setAnnouncingStatus] = useState("idle");

  // Per-user action loading
  const [actionLoading, setActionLoading] = useState({});

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const loadUsers = useCallback(async () => {
    const res = await API.get("/admin/users");
    setUsers(res.data);
  }, []);

  const loadProjects = useCallback(async () => {
    const res = await API.get("/admin/projects");
    setProjects(res.data);
  }, []);

  const loadAnalytics = useCallback(async () => {
    const res = await API.get("/admin/analytics");
    setAnalytics(res.data);
  }, []);

  const loadAuditLog = useCallback(async () => {
    const res = await API.get("/admin/audit-log");
    setAuditLog(res.data);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadUsers(),
      loadProjects(),
      loadAnalytics(),
      loadAuditLog(),
    ]);
  }, [loadUsers, loadProjects, loadAnalytics, loadAuditLog]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsed);
    if (!parsed || parsed.role !== "admin") {
      router.push("/login");
      return;
    }
    refreshAll().catch(() => router.push("/login"));
  }, []);

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q
      ? users.filter((u) =>
          `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q),
        )
      : users;
  }, [users, searchQuery]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q
      ? projects.filter((p) =>
          `${p.title} ${p.description || ""} ${p.creator_name || ""}`
            .toLowerCase()
            .includes(q),
        )
      : projects;
  }, [projects, searchQuery]);

  // ── Per-user action helper ─────────────────────────────────────────────────
  const doUserAction = async (uid, key, apiCall) => {
    setActionLoading((prev) => ({ ...prev, [`${uid}-${key}`]: true }));
    try {
      await apiCall();
      await loadUsers();
      await loadAuditLog();
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`${uid}-${key}`]: false }));
    }
  };

  // ── Bulk action handler ────────────────────────────────────────────────────
  const handleBulk = async (action) => {
    if (!window.confirm(`Bulk ${action} ${selected.size} user(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await API.post("/admin/users/bulk-action", {
        action,
        userIds: [...selected],
      });
      alert(res.data.message);
      setSelected(new Set());
      await loadUsers();
      await loadAuditLog();
    } catch (err) {
      alert(err?.response?.data?.message || "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Announcement handler ───────────────────────────────────────────────────
  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;
    setAnnouncingStatus("loading");
    try {
      const res = await API.post("/admin/announcement", {
        message: announcement,
      });
      setAnnouncingStatus("success");
      setAnnouncement("");
      alert(res.data.message);
      await loadAuditLog();
    } catch (err) {
      setAnnouncingStatus("error");
      alert(err?.response?.data?.message || "Failed to send announcement");
    } finally {
      setTimeout(() => setAnnouncingStatus("idle"), 2000);
    }
  };

  if (!user) return null;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const growthLabels = analytics?.userGrowth?.map((r) => r.month) || [];
  const growthData = {
    labels: growthLabels,
    datasets: [
      {
        label: "New Users",
        data: analytics?.userGrowth?.map((r) => Number(r.count)) || [],
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34,211,238,0.12)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "New Projects",
        data: analytics?.projectGrowth?.map((r) => Number(r.count)) || [],
        borderColor: "#a78bfa",
        backgroundColor: "rgba(167,139,250,0.12)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const topProjectsData = {
    labels: analytics?.topProjects?.map((p) => p.title.slice(0, 20)) || [],
    datasets: [
      {
        label: "Tasks",
        data: analytics?.topProjects?.map((p) => Number(p.task_count)) || [],
        backgroundColor: [
          "#22d3ee",
          "#38bdf8",
          "#818cf8",
          "#a78bfa",
          "#c084fc",
        ],
        borderRadius: 8,
      },
    ],
  };

  const TABS = [
    { key: "users", label: `Users (${users.length})` },
    { key: "projects", label: `Projects (${projects.length})` },
    { key: "analytics", label: "Analytics" },
    { key: "audit", label: "Audit Log" },
  ];

  return (
    <main className="login-shell">
      <div className="layout dashboard-layout">
        {/* Left hero */}
        <section className="left dashboard-left">
          <div className="brand">
            <div className="brand-icon">S</div>
            <div className="brand-name">
              Student<span>Collab</span>Hub
            </div>
          </div>
          <div className="hero-text">
            <div className="hero-tag">Admin control center</div>
            <h1 className="hero-headline">
              Manage
              <br />
              <em>users</em> and
              <br />
              projects.
            </h1>
            <p className="hero-sub">
              System-wide moderation, analytics, and audit log.
            </p>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="stat-num">{analytics?.totalUsers ?? 0}</div>
              <div className="stat-label">Total users</div>
            </div>
            <div className="stat">
              <div className="stat-num">{analytics?.totalProjects ?? 0}</div>
              <div className="stat-label">Total projects</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                {analytics?.totalActiveProjects ?? 0}
              </div>
              <div className="stat-label">Active projects</div>
            </div>
          </div>
        </section>

        {/* Right content */}
        <section className="right dashboard-right">
          <div className="dashboard-content">
            <Navbar
              title="Admin Control Center"
              showDashboard
              onLogout={logout}
            />

            {/* ── Admin info bar ─────────────────────────────────────────── */}
            <section className="panel-card mb-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-300">
                  Signed in as{" "}
                  <strong className="text-white">{user.name}</strong>{" "}
                  <span className="text-cyan-300">({user.role})</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => router.push("/settings")}
                  >
                    My Settings
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => router.push("/dashboard?preview=member")}
                  >
                    Preview Member View
                  </button>
                </div>
              </div>
            </section>

            {/* ── Announcement ───────────────────────────────────────────── */}
            <section className="panel-card mb-4 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                📢 Platform Announcement
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="input-modern flex-1"
                  placeholder="Send a notification to all users…"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAnnouncement()}
                />
                <button
                  className="btn-primary shrink-0"
                  disabled={
                    announcingStatus === "loading" || !announcement.trim()
                  }
                  onClick={sendAnnouncement}
                >
                  {announcingStatus === "loading" ? "Sending…" : "Broadcast"}
                </button>
              </div>
            </section>

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div className="mb-4 flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={
                    activeTab === t.key ? "btn-primary" : "btn-secondary"
                  }
                  onClick={() => {
                    setActiveTab(t.key);
                    setSearchQuery("");
                    setSelected(new Set());
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════════════
                USERS TAB
            ════════════════════════════════════════════ */}
            {activeTab === "users" && (
              <section className="panel-card p-5">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <input
                    className="input-modern flex-1"
                    placeholder="Search users by name, email, role…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelected(new Set());
                    }}
                  />
                  <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {filteredUsers.length} shown
                  </span>
                </div>

                {/* Select all */}
                {filteredUsers.length > 0 && (
                  <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={
                        selected.size ===
                          filteredUsers.filter((u) => u.id !== user.id)
                            .length && filteredUsers.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelected(
                            new Set(
                              filteredUsers
                                .filter((u) => u.id !== user.id)
                                .map((u) => u.id),
                            ),
                          );
                        else setSelected(new Set());
                      }}
                    />
                    Select all
                  </label>
                )}

                <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === user.id;
                    const isChecked = selected.has(u.id);
                    const loading = (key) => actionLoading[`${u.id}-${key}`];
                    const joinDate = u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "—";

                    return (
                      <div
                        key={u.id}
                        className={`rounded-xl border bg-slate-900/60 p-3 transition ${isChecked ? "border-cyan-500/40 bg-cyan-500/5" : "border-slate-800"}`}
                      >
                        {/* Top row */}
                        <div className="flex flex-wrap items-start gap-3">
                          {!isSelf && (
                            <input
                              type="checkbox"
                              className="mt-1 shrink-0"
                              checked={isChecked}
                              onChange={() => {
                                setSelected((prev) => {
                                  const next = new Set(prev);
                                  next.has(u.id)
                                    ? next.delete(u.id)
                                    : next.add(u.id);
                                  return next;
                                });
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-100">
                                {u.name}
                              </p>
                              <Badge
                                color={u.role === "admin" ? "violet" : "slate"}
                              >
                                {u.role}
                              </Badge>
                              {u.is_suspended && (
                                <Badge color="red">Suspended</Badge>
                              )}
                              {isSelf && <Badge color="blue">You</Badge>}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {u.email}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Joined {joinDate} · {u.project_count} project
                              {u.project_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {/* Actions */}
                          {!isSelf && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {u.role !== "admin" && (
                                <ActionBtn
                                  variant="primary"
                                  disabled={loading("promote")}
                                  onClick={() =>
                                    doUserAction(u.id, "promote", () =>
                                      API.put(`/admin/users/promote/${u.id}`),
                                    )
                                  }
                                >
                                  ↑ Promote
                                </ActionBtn>
                              )}
                              {u.role === "admin" && (
                                <ActionBtn
                                  variant="amber"
                                  disabled={loading("demote")}
                                  onClick={() =>
                                    doUserAction(u.id, "demote", () =>
                                      API.put(`/admin/users/demote/${u.id}`),
                                    )
                                  }
                                >
                                  ↓ Demote
                                </ActionBtn>
                              )}
                              {!u.is_suspended ? (
                                <ActionBtn
                                  variant="amber"
                                  disabled={loading("suspend")}
                                  onClick={() => {
                                    if (window.confirm(`Suspend ${u.name}?`))
                                      doUserAction(u.id, "suspend", () =>
                                        API.put(`/admin/users/suspend/${u.id}`),
                                      );
                                  }}
                                >
                                  🚫 Suspend
                                </ActionBtn>
                              ) : (
                                <ActionBtn
                                  variant="success"
                                  disabled={loading("unsuspend")}
                                  onClick={() =>
                                    doUserAction(u.id, "unsuspend", () =>
                                      API.put(`/admin/users/unsuspend/${u.id}`),
                                    )
                                  }
                                >
                                  ✓ Unsuspend
                                </ActionBtn>
                              )}
                              <ActionBtn
                                variant="secondary"
                                disabled={loading("reset")}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Send password reset email to ${u.email}?`,
                                    )
                                  )
                                    doUserAction(u.id, "reset", () =>
                                      API.post(
                                        `/admin/users/${u.id}/force-reset`,
                                      ),
                                    );
                                }}
                              >
                                🔑 Reset PW
                              </ActionBtn>
                              <ActionBtn
                                variant="danger"
                                disabled={loading("delete")}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Delete ${u.name} permanently?`,
                                    )
                                  )
                                    doUserAction(u.id, "delete", () =>
                                      API.delete(`/admin/users/${u.id}`),
                                    );
                                }}
                              >
                                🗑 Delete
                              </ActionBtn>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════════
                PROJECTS TAB
            ════════════════════════════════════════════ */}
            {activeTab === "projects" && (
              <section className="panel-card p-5">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <input
                    className="input-modern flex-1"
                    placeholder="Search projects by title, description, creator…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {filteredProjects.length} shown
                  </span>
                </div>
                <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">
                  {filteredProjects.map((p) => {
                    const pct =
                      p.task_count > 0
                        ? Math.round(
                            (p.completed_task_count / p.task_count) * 100,
                          )
                        : 0;
                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-100">
                                {p.title}
                              </p>
                              <Badge
                                color={
                                  p.status === "active" ? "green" : "slate"
                                }
                              >
                                {p.status}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                              {p.description || "No description"}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-500">
                              <span>
                                👤 Creator:{" "}
                                <strong className="text-slate-300">
                                  {p.creator_name}
                                </strong>
                              </span>
                              <span>
                                👥 {p.member_count} member
                                {p.member_count !== 1 ? "s" : ""}
                              </span>
                              <span>
                                📋 {p.task_count} task
                                {p.task_count !== 1 ? "s" : ""} ({pct}% done)
                              </span>
                              {p.created_at && (
                                <span>
                                  🗓{" "}
                                  {new Date(p.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {p.task_count > 0 && (
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-emerald-400 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <ActionBtn
                              variant="primary"
                              onClick={() => router.push(`/project/${p.id}`)}
                            >
                              Open
                            </ActionBtn>
                            <ActionBtn
                              variant="danger"
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    `Delete project "${p.title}"?`,
                                  )
                                )
                                  return;
                                try {
                                  await API.delete(`/admin/projects/${p.id}`);
                                  await loadProjects();
                                  await loadAuditLog();
                                } catch (err) {
                                  alert(
                                    err?.response?.data?.message || "Failed",
                                  );
                                }
                              }}
                            >
                              🗑 Delete
                            </ActionBtn>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ════════════════════════════════════════════
                ANALYTICS TAB
            ════════════════════════════════════════════ */}
            {activeTab === "analytics" && analytics && (
              <div className="flex flex-col gap-4">
                {/* Stat grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  <StatCard
                    label="Total Users"
                    value={analytics.totalUsers}
                    color="text-cyan-300"
                  />
                  <StatCard
                    label="Total Projects"
                    value={analytics.totalProjects}
                    color="text-emerald-300"
                  />
                  <StatCard
                    label="Active Projects"
                    value={analytics.totalActiveProjects}
                    color="text-sky-300"
                  />
                  <StatCard
                    label="Total Tasks"
                    value={analytics.totalTasks}
                    color="text-violet-300"
                  />
                  <StatCard
                    label="Completed Tasks"
                    value={analytics.totalCompletedTasks}
                    color="text-emerald-300"
                  />
                  <StatCard
                    label="Total Messages"
                    value={analytics.totalMessages}
                    color="text-amber-300"
                  />
                  <StatCard
                    label="Suspended Users"
                    value={analytics.suspendedUsers}
                    color="text-rose-300"
                  />
                  <StatCard
                    label="Admin Accounts"
                    value={analytics.adminUsers}
                    color="text-fuchsia-300"
                  />
                  <StatCard
                    label="Task Completion"
                    value={
                      analytics.totalTasks > 0
                        ? `${Math.round((analytics.totalCompletedTasks / analytics.totalTasks) * 100)}%`
                        : "—"
                    }
                    color="text-cyan-300"
                  />
                  <StatCard
                    label="Completed Projects"
                    value={analytics.totalCompletedProjects}
                    color="text-slate-300"
                  />
                </div>

                {/* Growth line chart */}
                <div className="panel-card p-5">
                  <h3 className="mb-4 text-base font-semibold text-white">
                    Platform Growth (Last 6 Months)
                  </h3>
                  <div className="h-60">
                    <Line data={growthData} options={LINE_OPTS} />
                  </div>
                </div>

                {/* Top projects bar chart */}
                {analytics.topProjects?.length > 0 && (
                  <div className="panel-card p-5">
                    <h3 className="mb-4 text-base font-semibold text-white">
                      Top 5 Most Active Projects (by Tasks)
                    </h3>
                    <div className="h-52">
                      <Bar data={topProjectsData} options={CHART_OPTS} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                AUDIT LOG TAB
            ════════════════════════════════════════════ */}
            {activeTab === "audit" && (
              <section className="panel-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">
                    Admin Audit Log
                  </h3>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                    {auditLog.length} entries
                  </span>
                </div>
                {auditLog.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No admin actions have been recorded yet.
                  </p>
                ) : (
                  <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
                    {auditLog.map((entry) => {
                      const actionColor =
                        {
                          DELETE_USER: "text-rose-400",
                          BULK_DELETE_USERS: "text-rose-400",
                          DELETE_PROJECT: "text-rose-400",
                          SUSPEND_USER: "text-amber-400",
                          BULK_SUSPEND_USERS: "text-amber-400",
                          FORCE_RESET: "text-sky-400",
                          PROMOTE_USER: "text-violet-400",
                          DEMOTE_USER: "text-amber-400",
                          BULK_DEMOTE_USERS: "text-amber-400",
                          UNSUSPEND_USER: "text-emerald-400",
                          ANNOUNCEMENT: "text-cyan-400",
                        }[entry.action] || "text-slate-400";

                      return (
                        <div
                          key={entry.id}
                          className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs font-bold ${actionColor}`}
                              >
                                {entry.action.replace(/_/g, " ")}
                              </span>
                              {entry.target_type && (
                                <Badge
                                  color={
                                    entry.target_type === "user"
                                      ? "blue"
                                      : entry.target_type === "project"
                                        ? "green"
                                        : "slate"
                                  }
                                >
                                  {entry.target_type}
                                </Badge>
                              )}
                              {entry.target_label && (
                                <span className="text-xs text-slate-200">
                                  {entry.target_label}
                                </span>
                              )}
                            </div>
                            {entry.details && (
                              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                                {entry.details}
                              </p>
                            )}
                            <p className="mt-0.5 text-[11px] text-slate-600">
                              by{" "}
                              <strong className="text-slate-400">
                                {entry.admin_name}
                              </strong>{" "}
                              · {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        </section>
      </div>

      {/* ── Floating bulk action bar ────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 px-5 py-3 shadow-2xl backdrop-blur">
          <span className="text-sm font-semibold text-slate-200">
            {selected.size} user{selected.size > 1 ? "s" : ""} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <ActionBtn
            variant="amber"
            disabled={bulkLoading}
            onClick={() => handleBulk("suspend")}
          >
            🚫 Suspend All
          </ActionBtn>
          <ActionBtn
            variant="amber"
            disabled={bulkLoading}
            onClick={() => handleBulk("demote")}
          >
            ↓ Demote All
          </ActionBtn>
          <ActionBtn
            variant="danger"
            disabled={bulkLoading}
            onClick={() => handleBulk("delete")}
          >
            🗑 Delete All
          </ActionBtn>
          <ActionBtn variant="secondary" onClick={() => setSelected(new Set())}>
            ✕ Cancel
          </ActionBtn>
        </div>
      )}
    </main>
  );
}
