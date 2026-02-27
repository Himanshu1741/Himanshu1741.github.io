import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import API from "../services/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), { ssr: false });
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), { ssr: false });
const Doughnut = dynamic(() => import("react-chartjs-2").then((m) => m.Doughnut), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

// --- Toast System ---
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, toast: add };
}

function ToastContainer({ toasts }) {
  const icons = { success: "OK", error: "X", info: "i", warning: "!" };
  const colors = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  };
  return (
    <div className="fixed right-5 top-5 z-[9999] flex flex-col gap-2" style={{ pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm ${colors[t.type]}`}
          style={{ pointerEvents: "auto", animation: "slideInRight 0.25s ease" }}
        >
          <span className="text-xs font-black">{icons[t.type]}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// --- Confirm Modal ---
function ConfirmModal({ open, title, message, onConfirm, onCancel, variant = "danger" }) {
  if (!open) return null;
  const btnColors = {
    danger: "bg-rose-500 hover:bg-rose-400 text-white",
    warning: "bg-amber-500 hover:bg-amber-400 text-slate-900",
  };
  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
        <p className="mb-5 text-sm text-slate-400">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition" onClick={onCancel}>Cancel</button>
          <button className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${btnColors[variant]}`} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// --- Avatar ---
function Avatar({ name, size = "md" }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const colours = ["from-cyan-500 to-blue-500", "from-violet-500 to-purple-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-500"];
  const bg = colours[initials.charCodeAt(0) % colours.length];
  const sz = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-11 w-11 text-sm" };
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${bg} ${sz[size]}`}>
      {initials}
    </div>
  );
}

// --- Badge ---
function Badge({ children, color = "slate" }) {
  const map = {
    red: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    blue: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    slate: "bg-slate-700/60 text-slate-400 border-slate-600/60",
    cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[color]}`}>
      {children}
    </span>
  );
}

// --- Stat Card ---
function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700`}>
      <div className={`absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl opacity-20 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-extrabold tracking-tight text-white`}>{value ?? 0}</p>
          {sub && <p className="mt-1 text-[11px] text-slate-600">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// --- Action Button ---
function ActionBtn({ onClick, variant = "secondary", disabled, children, size = "sm" }) {
  const base = `inline-flex items-center gap-1.5 rounded-lg border font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"}`;
  const styles = {
    secondary: "border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700",
    danger: "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/25",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/25",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/25",
    primary: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/25",
    violet: "border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/25",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// --- Spinner ---
function Spinner({ size = 14 }) {
  return (
    <span
      style={{ width: size, height: size, borderWidth: 2 }}
      className="inline-block animate-spin rounded-full border-current border-t-transparent opacity-70"
    />
  );
}

// --- Chart options ---
const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#64748b" }, grid: { color: "rgba(100,116,139,0.06)" } },
    y: { ticks: { color: "#64748b" }, grid: { color: "rgba(100,116,139,0.06)" } },
  },
};

const LINE_OPTS = {
  ...CHART_OPTS,
  plugins: { legend: { display: true, labels: { color: "#94a3b8", usePointStyle: true, boxWidth: 8 } } },
};

const DONUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  plugins: { legend: { position: "bottom", labels: { color: "#94a3b8", usePointStyle: true, boxWidth: 8 } } },
};

// --- Sidebar nav items ---
const NAV_ITEMS = [
  { key: "overview", icon: "HOME", label: "Overview" },
  { key: "users", icon: "USERS", label: "Users" },
  { key: "projects", icon: "FOLDER", label: "Projects" },
  { key: "analytics", icon: "CHART", label: "Analytics" },
  { key: "audit", icon: "LOG", label: "Audit Log" },
];

const NAV_EMOJIS = {
  overview: "🏠",
  users: "👥",
  projects: "📁",
  analytics: "📊",
  audit: "📋",
};

// --- Main component ---
export default function Admin() {
  const router = useRouter();
  const { toasts, toast } = useToast();

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [announcingStatus, setAnnouncingStatus] = useState("idle");
  const [actionLoading, setActionLoading] = useState({});

  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null, variant: "danger" });
  const ask = (title, message, onConfirm, variant = "danger") =>
    setConfirm({ open: true, title, message, onConfirm, variant });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const loadUsers = useCallback(async () => { const r = await API.get("/admin/users"); setUsers(r.data); }, []);
  const loadProjects = useCallback(async () => { const r = await API.get("/admin/projects"); setProjects(r.data); }, []);
  const loadAnalytics = useCallback(async () => { const r = await API.get("/admin/analytics"); setAnalytics(r.data); }, []);
  const loadAuditLog = useCallback(async () => { const r = await API.get("/admin/audit-log"); setAuditLog(r.data); }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadUsers(), loadProjects(), loadAnalytics(), loadAuditLog()]);
    setIsLoading(false);
  }, [loadUsers, loadProjects, loadAnalytics, loadAuditLog]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    setUser(parsed);
    if (!parsed || parsed.role !== "admin") { router.push("/login"); return; }
    refreshAll().catch(() => router.push("/login"));
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)) : users;
  }, [users, searchQuery]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? projects.filter((p) => `${p.title} ${p.description || ""} ${p.creator_name || ""}`.toLowerCase().includes(q)) : projects;
  }, [projects, searchQuery]);

  const doUserAction = async (uid, key, apiCall, successMsg) => {
    setActionLoading((prev) => ({ ...prev, [`${uid}-${key}`]: true }));
    try {
      await apiCall();
      await loadUsers();
      await loadAuditLog();
      toast(successMsg || "Done", "success");
    } catch (err) {
      toast(err?.response?.data?.message || "Action failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`${uid}-${key}`]: false }));
    }
  };

  const handleBulk = async (action) => {
    ask(`Bulk ${action}`, `Apply "${action}" to ${selected.size} user(s)?`, async () => {
      closeConfirm();
      setBulkLoading(true);
      try {
        const res = await API.post("/admin/users/bulk-action", { action, userIds: [...selected] });
        toast(res.data.message, "success");
        setSelected(new Set());
        await loadUsers();
        await loadAuditLog();
      } catch (err) {
        toast(err?.response?.data?.message || "Bulk action failed", "error");
      } finally {
        setBulkLoading(false);
      }
    }, action === "delete" ? "danger" : "warning");
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return;
    setAnnouncingStatus("loading");
    try {
      await API.post("/admin/announcement", { message: announcement });
      toast("Announcement broadcast to all users!", "success");
      setAnnouncement("");
      setAnnouncingStatus("success");
      await loadAuditLog();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed to send", "error");
      setAnnouncingStatus("error");
    } finally {
      setTimeout(() => setAnnouncingStatus("idle"), 2000);
    }
  };

  if (!user) return null;

  const growthData = {
    labels: analytics?.userGrowth?.map((r) => r.month) || [],
    datasets: [
      { label: "New Users", data: analytics?.userGrowth?.map((r) => Number(r.count)) || [], borderColor: "#22d3ee", backgroundColor: "rgba(34,211,238,0.08)", tension: 0.4, fill: true, pointBackgroundColor: "#22d3ee" },
      { label: "New Projects", data: analytics?.projectGrowth?.map((r) => Number(r.count)) || [], borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.08)", tension: 0.4, fill: true, pointBackgroundColor: "#a78bfa" },
    ],
  };

  const topProjectsData = {
    labels: analytics?.topProjects?.map((p) => p.title.slice(0, 18)) || [],
    datasets: [{ data: analytics?.topProjects?.map((p) => Number(p.task_count)) || [], backgroundColor: ["#22d3ee", "#38bdf8", "#818cf8", "#a78bfa", "#c084fc"], borderRadius: 8, borderWidth: 0 }],
  };

  const taskPct = analytics?.totalTasks > 0 ? Math.round((analytics.totalCompletedTasks / analytics.totalTasks) * 100) : 0;
  const donutData = analytics ? {
    labels: ["Completed", "Remaining"],
    datasets: [{ data: [analytics.totalCompletedTasks, analytics.totalTasks - analytics.totalCompletedTasks], backgroundColor: ["#10b981", "#1e293b"], borderWidth: 0, hoverOffset: 4 }],
  } : null;

  const countBadge = { users: users.length, projects: projects.length, audit: auditLog.length };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .tab-content { animation: fadeUp 0.2s ease; }
      `}</style>

      <ToastContainer toasts={toasts} />
      <ConfirmModal {...confirm} onCancel={closeConfirm} />

      {/* Sidebar */}
      <aside
        className="relative flex flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300 z-20"
        style={{ width: sidebarOpen ? 220 : 64 }}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/20">
            S
          </div>
          {sidebarOpen && (
            <span className="truncate text-sm font-bold text-white">
              Student<span className="text-cyan-400">Collab</span>
            </span>
          )}
          <button
            className="ml-auto shrink-0 rounded-lg p-1.5 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse" : "Expand"}
          >
            {sidebarOpen ? "<<" : ">>"}
          </button>
        </div>

        {/* Admin label */}
        {sidebarOpen && (
          <div className="border-b border-slate-800 px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Admin Panel</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            const cnt = countBadge[item.key];
            return (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setSearchQuery(""); setSelected(new Set()); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                    : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 border border-transparent"
                }`}
              >
                <span className="shrink-0 text-base leading-none">{NAV_EMOJIS[item.key]}</span>
                {sidebarOpen && (
                  <>
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    {cnt !== undefined && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500"}`}>
                        {cnt}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-3">
          <div className={`flex items-center gap-2.5 ${sidebarOpen ? "" : "justify-center"}`}>
            <Avatar name={user.name} size="sm" />
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-600">Administrator</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={logout} className="shrink-0 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-rose-500/10 hover:text-rose-400 transition border border-transparent hover:border-rose-500/20" title="Sign out">
                Exit
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-950/80 px-6 z-10" style={{ backdropFilter: "blur(12px)" }}>
          <div>
            <h1 className="text-base font-bold text-white">
              {NAV_EMOJIS[activeTab]}{" "}
              {activeTab === "overview" ? "Admin Dashboard" : NAV_ITEMS.find((n) => n.key === activeTab)?.label}
            </h1>
            <p className="text-[11px] text-slate-600">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition disabled:opacity-50"
              onClick={refreshAll}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
            <button
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
              onClick={() => router.push("/settings")}
            >
              Settings
            </button>
            <button
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
              onClick={() => router.push("/dashboard?preview=member")}
            >
              Member View
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6">

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="tab-content space-y-6">
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
                  <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-500/8 blur-3xl" />
                  <div className="absolute right-32 -bottom-8 h-28 w-28 rounded-full bg-violet-500/8 blur-3xl" />
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-500">Admin Control Center</p>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">Welcome back, {user.name}!</h2>
                  <p className="mt-1 text-sm text-slate-500">Here is an overview of the platform activity.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="Total Users" value={analytics?.totalUsers} icon="👥" accent="bg-cyan-500/20" />
                  <StatCard label="Active Projects" value={analytics?.totalActiveProjects} icon="🚀" accent="bg-emerald-500/20" />
                  <StatCard label="Tasks Completed" value={analytics?.totalCompletedTasks} icon="✅" accent="bg-violet-500/20" />
                  <StatCard label="Suspended" value={analytics?.suspendedUsers} icon="🚫" accent="bg-rose-500/20" />
                </div>

                {/* Announcement */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-base">📢</div>
                    <div>
                      <p className="text-sm font-semibold text-white">Broadcast Announcement</p>
                      <p className="text-[11px] text-slate-600">Sends a notification to every active user</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      className="input-modern flex-1"
                      placeholder="Type a platform-wide message and hit Enter or Broadcast..."
                      value={announcement}
                      onChange={(e) => setAnnouncement(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendAnnouncement()}
                    />
                    <button
                      className="btn-primary shrink-0"
                      disabled={announcingStatus === "loading" || !announcement.trim()}
                      onClick={sendAnnouncement}
                    >
                      {announcingStatus === "loading" ? "Sending..." : "Broadcast"}
                    </button>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Recent Admin Activity</p>
                    <button className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition" onClick={() => setActiveTab("audit")}>View all</button>
                  </div>
                  {auditLog.length === 0 ? (
                    <p className="text-xs text-slate-600">No activity yet.</p>
                  ) : (
                    <div className="space-y-0">
                      {auditLog.slice(0, 6).map((entry, i) => {
                        const isLast = i === Math.min(5, auditLog.length - 1);
                        const actionColor = {
                          DELETE_USER: "text-rose-400", BULK_DELETE_USERS: "text-rose-400", DELETE_PROJECT: "text-rose-400",
                          SUSPEND_USER: "text-amber-400", FORCE_RESET: "text-sky-400", PROMOTE_USER: "text-violet-400",
                          DEMOTE_USER: "text-amber-400", UNSUSPEND_USER: "text-emerald-400", ANNOUNCEMENT: "text-cyan-400",
                        }[entry.action] || "text-slate-400";
                        return (
                          <div key={entry.id} className={`flex items-start gap-3 py-2.5 ${!isLast ? "border-b border-slate-800/60" : ""}`}>
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-xs font-bold ${actionColor}`}>{entry.action.replace(/_/g, " ")}</span>
                                {entry.target_label && <span className="text-xs text-slate-400">&rarr; {entry.target_label}</span>}
                              </div>
                              <p className="text-[11px] text-slate-600">by {entry.admin_name} &middot; {new Date(entry.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === "users" && (
              <div className="tab-content space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <input
                      className="input-modern pl-4"
                      placeholder="Search by name, email or role..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSelected(new Set()); }}
                    />
                  </div>
                  <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-500">
                    {filteredUsers.length} of {users.length}
                  </span>
                </div>

                {filteredUsers.length > 0 && (
                  <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      className="accent-cyan-400"
                      checked={selected.size > 0 && selected.size === filteredUsers.filter((u) => u.id !== user.id).length}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(new Set(filteredUsers.filter((u) => u.id !== user.id).map((u) => u.id)));
                        else setSelected(new Set());
                      }}
                    />
                    Select all eligible
                    {selected.size > 0 && <Badge color="cyan">{selected.size} selected</Badge>}
                  </label>
                )}

                <div className="space-y-2">
                  {filteredUsers.length === 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-center text-sm text-slate-600">
                      No users match your search.
                    </div>
                  )}
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === user.id;
                    const isChecked = selected.has(u.id);
                    const loading = (key) => actionLoading[`${u.id}-${key}`];
                    const joinDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : "?";
                    return (
                      <div
                        key={u.id}
                        className={`rounded-2xl border p-4 transition-all ${isChecked ? "border-cyan-500/30 bg-cyan-500/5" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"}`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          {!isSelf && (
                            <input type="checkbox" className="accent-cyan-400 shrink-0" checked={isChecked}
                              onChange={() => setSelected((prev) => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n; })} />
                          )}
                          <Avatar name={u.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-100">{u.name}</p>
                              <Badge color={u.role === "admin" ? "violet" : "slate"}>{u.role}</Badge>
                              {u.is_suspended && <Badge color="red">Suspended</Badge>}
                              {isSelf && <Badge color="cyan">You</Badge>}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">{u.email}</p>
                            <p className="mt-0.5 text-[11px] text-slate-600">Joined {joinDate} &middot; {u.project_count ?? 0} project{u.project_count !== 1 ? "s" : ""}</p>
                          </div>
                          {!isSelf && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {u.role !== "admin" && (
                                <ActionBtn variant="primary" disabled={loading("promote")}
                                  onClick={() => doUserAction(u.id, "promote", () => API.put(`/admin/users/promote/${u.id}`), `${u.name} promoted`)}>
                                  {loading("promote") ? <Spinner /> : null} Promote
                                </ActionBtn>
                              )}
                              {u.role === "admin" && (
                                <ActionBtn variant="amber" disabled={loading("demote")}
                                  onClick={() => ask("Demote Admin", `Demote ${u.name} to member?`, () => { closeConfirm(); doUserAction(u.id, "demote", () => API.put(`/admin/users/demote/${u.id}`), `${u.name} demoted`); }, "warning")}>
                                  {loading("demote") ? <Spinner /> : null} Demote
                                </ActionBtn>
                              )}
                              {!u.is_suspended ? (
                                <ActionBtn variant="amber" disabled={loading("suspend")}
                                  onClick={() => ask("Suspend User", `Suspend ${u.name}? They won't be able to log in.`, () => { closeConfirm(); doUserAction(u.id, "suspend", () => API.put(`/admin/users/suspend/${u.id}`), `${u.name} suspended`); }, "warning")}>
                                  {loading("suspend") ? <Spinner /> : null} Suspend
                                </ActionBtn>
                              ) : (
                                <ActionBtn variant="success" disabled={loading("unsuspend")}
                                  onClick={() => doUserAction(u.id, "unsuspend", () => API.put(`/admin/users/unsuspend/${u.id}`), `${u.name} unsuspended`)}>
                                  {loading("unsuspend") ? <Spinner /> : null} Unsuspend
                                </ActionBtn>
                              )}
                              <ActionBtn variant="secondary" disabled={loading("reset")}
                                onClick={() => ask("Force Password Reset", `Send a reset email to ${u.email}?`, () => { closeConfirm(); doUserAction(u.id, "reset", () => API.post(`/admin/users/${u.id}/force-reset`), "Reset email sent"); }, "warning")}>
                                {loading("reset") ? <Spinner /> : null} Reset PW
                              </ActionBtn>
                              <ActionBtn variant="danger" disabled={loading("delete")}
                                onClick={() => ask("Delete User", `Permanently delete ${u.name}? This cannot be undone.`, () => { closeConfirm(); doUserAction(u.id, "delete", () => API.delete(`/admin/users/${u.id}`), `${u.name} deleted`); })}>
                                {loading("delete") ? <Spinner /> : null} Delete
                              </ActionBtn>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PROJECTS */}
            {activeTab === "projects" && (
              <div className="tab-content space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <input
                      className="input-modern pl-4"
                      placeholder="Search by title, description or creator..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-500">
                    {filteredProjects.length} of {projects.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredProjects.length === 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-center text-sm text-slate-600">
                      No projects match your search.
                    </div>
                  )}
                  {filteredProjects.map((p) => {
                    const pct = p.task_count > 0 ? Math.round((p.completed_task_count / p.task_count) * 100) : 0;
                    const barColor = pct >= 100 ? "bg-emerald-400" : pct > 60 ? "bg-cyan-400" : pct > 30 ? "bg-amber-400" : "bg-violet-400";
                    return (
                      <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-all">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-100">{p.title}</p>
                              <Badge color={p.status === "active" ? "green" : "slate"}>{p.status}</Badge>
                            </div>
                            <p className="mb-3 text-xs text-slate-600 line-clamp-1">{p.description || "No description provided."}</p>
                            <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
                              <span>Creator: <strong className="text-slate-300">{p.creator_name}</strong></span>
                              <span>{p.member_count} member{p.member_count !== 1 ? "s" : ""}</span>
                              <span>{p.task_count} task{p.task_count !== 1 ? "s" : ""}</span>
                              <span>{p.completed_task_count} completed</span>
                              {p.created_at && <span>{new Date(p.created_at).toLocaleDateString()}</span>}
                            </div>
                            {p.task_count > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-slate-500">{pct}%</span>
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col gap-2">
                            <ActionBtn variant="primary" size="md" onClick={() => router.push(`/project/${p.id}`)}>Open</ActionBtn>
                            <ActionBtn variant="danger" size="md"
                              onClick={() => ask("Delete Project", `Permanently delete "${p.title}"? All data will be lost.`, async () => {
                                closeConfirm();
                                try {
                                  await API.delete(`/admin/projects/${p.id}`);
                                  await loadProjects(); await loadAuditLog();
                                  toast(`"${p.title}" deleted`, "success");
                                } catch (err) { toast(err?.response?.data?.message || "Delete failed", "error"); }
                              })}>Delete</ActionBtn>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            {activeTab === "analytics" && analytics && (
              <div className="tab-content space-y-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                  <StatCard label="Total Users" value={analytics.totalUsers} icon="👥" accent="bg-cyan-500/20" />
                  <StatCard label="Total Projects" value={analytics.totalProjects} icon="📁" accent="bg-emerald-500/20" />
                  <StatCard label="Active Projects" value={analytics.totalActiveProjects} icon="🚀" accent="bg-sky-500/20" />
                  <StatCard label="Total Tasks" value={analytics.totalTasks} icon="📋" accent="bg-violet-500/20" />
                  <StatCard label="Completed Tasks" value={analytics.totalCompletedTasks} icon="✅" accent="bg-emerald-500/20" sub={`${taskPct}% completion`} />
                  <StatCard label="Total Messages" value={analytics.totalMessages} icon="💬" accent="bg-amber-500/20" />
                  <StatCard label="Suspended Users" value={analytics.suspendedUsers} icon="🚫" accent="bg-rose-500/20" />
                  <StatCard label="Admin Accounts" value={analytics.adminUsers} icon="🛡" accent="bg-fuchsia-500/20" />
                  <StatCard label="Completed Projects" value={analytics.totalCompletedProjects} icon="🏁" accent="bg-slate-500/20" />
                  <StatCard label="Completion Rate" value={`${taskPct}%`} icon="📈" accent="bg-cyan-500/20" sub="of all tasks" />
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <h3 className="mb-4 text-sm font-bold text-white">Platform Growth (Last 6 Months)</h3>
                    <div className="h-56"><Line data={growthData} options={LINE_OPTS} /></div>
                  </div>
                  {donutData && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col items-center">
                      <h3 className="mb-4 w-full text-sm font-bold text-white">Task Completion</h3>
                      <div className="h-44 w-full"><Doughnut data={donutData} options={DONUT_OPTS} /></div>
                      <p className="mt-3 text-3xl font-extrabold text-emerald-400">{taskPct}%</p>
                      <p className="text-xs text-slate-600">tasks completed</p>
                    </div>
                  )}
                </div>

                {analytics.topProjects?.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <h3 className="mb-4 text-sm font-bold text-white">Top 5 Most Active Projects (by Tasks)</h3>
                    <div className="h-52"><Bar data={topProjectsData} options={CHART_OPTS} /></div>
                  </div>
                )}
              </div>
            )}

            {/* AUDIT LOG */}
            {activeTab === "audit" && (
              <div className="tab-content space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Admin Audit Log</h3>
                  <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-500">{auditLog.length} entries</span>
                </div>

                {auditLog.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-12 text-center text-sm text-slate-600">
                    No admin actions have been logged yet.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-800 pl-6 space-y-3">
                    {auditLog.map((entry) => {
                      const meta = {
                        DELETE_USER: { color: "text-rose-400", dot: "bg-rose-500", icon: "D" },
                        BULK_DELETE_USERS: { color: "text-rose-400", dot: "bg-rose-500", icon: "D" },
                        DELETE_PROJECT: { color: "text-rose-400", dot: "bg-rose-500", icon: "D" },
                        SUSPEND_USER: { color: "text-amber-400", dot: "bg-amber-500", icon: "S" },
                        BULK_SUSPEND_USERS: { color: "text-amber-400", dot: "bg-amber-500", icon: "S" },
                        FORCE_RESET: { color: "text-sky-400", dot: "bg-sky-500", icon: "R" },
                        PROMOTE_USER: { color: "text-violet-400", dot: "bg-violet-500", icon: "P" },
                        DEMOTE_USER: { color: "text-amber-400", dot: "bg-amber-500", icon: "V" },
                        BULK_DEMOTE_USERS: { color: "text-amber-400", dot: "bg-amber-500", icon: "V" },
                        UNSUSPEND_USER: { color: "text-emerald-400", dot: "bg-emerald-500", icon: "U" },
                        ANNOUNCEMENT: { color: "text-cyan-400", dot: "bg-cyan-500", icon: "A" },
                      }[entry.action] || { color: "text-slate-400", dot: "bg-slate-600", icon: "-" };

                      return (
                        <div key={entry.id} className="relative">
                          <div className={`absolute -left-[25px] top-3.5 h-3 w-3 rounded-full border-2 border-slate-950 ${meta.dot}`} />
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 hover:border-slate-700 transition-all">
                            <div className="flex flex-wrap items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-xs font-bold ${meta.color}`}>{entry.action.replace(/_/g, " ")}</span>
                                  {entry.target_type && (
                                    <Badge color={entry.target_type === "user" ? "blue" : entry.target_type === "project" ? "green" : "slate"}>
                                      {entry.target_type}
                                    </Badge>
                                  )}
                                  {entry.target_label && <span className="text-xs text-slate-300">&rarr; {entry.target_label}</span>}
                                </div>
                                {entry.details && <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-1">{entry.details}</p>}
                                <p className="mt-1 text-[11px] text-slate-600">
                                  by <strong className="text-slate-400">{entry.admin_name}</strong>
                                  &nbsp;&middot;&nbsp;{new Date(entry.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Floating bulk bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/95 px-5 py-3 shadow-2xl" style={{ backdropFilter: "blur(16px)" }}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-bold text-cyan-300">{selected.size}</div>
          <span className="text-sm font-semibold text-slate-200">{selected.size} selected</span>
          <div className="h-4 w-px bg-slate-800" />
          <ActionBtn variant="amber" size="md" disabled={bulkLoading} onClick={() => handleBulk("suspend")}>Suspend All</ActionBtn>
          <ActionBtn variant="amber" size="md" disabled={bulkLoading} onClick={() => handleBulk("demote")}>Demote All</ActionBtn>
          <ActionBtn variant="danger" size="md" disabled={bulkLoading} onClick={() => handleBulk("delete")}>Delete All</ActionBtn>
          <div className="h-4 w-px bg-slate-800" />
          <ActionBtn variant="secondary" size="md" onClick={() => setSelected(new Set())}>Clear</ActionBtn>
        </div>
      )}
    </div>
  );
}
