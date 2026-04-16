/**
 * Dashboard Page - Admin Style Design
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";

const Pie = dynamic(() => import("react-chartjs-2").then((mod) => mod.Pie), {
  ssr: false,
});
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

// Toast
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, toast };
}

function ToastContainer({ toasts }) {
  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "!" };
  const colors = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  };
  return (
    <div
      className="fixed right-5 top-5 z-[9999] flex flex-col gap-2"
      style={{ pointerEvents: "none" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm ${colors[t.type]}`}
          style={{
            pointerEvents: "auto",
            animation: "slideInRight 0.25s ease",
          }}
        >
          <span className="text-xs font-black">{icons[t.type]}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Badge
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
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[color]}`}
    >
      {children}
    </span>
  );
}

// StatCard
function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700`}
    >
      <div
        className={`absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl opacity-20 ${accent}`}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            {value ?? 0}
          </p>
          {sub && <p className="mt-1 text-[11px] text-slate-600">{sub}</p>}
        </div>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${accent}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// Avatar
function Avatar({ name, size = "md" }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colours = [
    "from-cyan-500 to-blue-500",
    "from-violet-500 to-purple-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
  ];
  const bg = colours[initials.charCodeAt(0) % colours.length];
  const sz = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${bg} ${sz[size]}`}
    >
      {initials}
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, toast } = useToast();
  const router = useRouter();

  const loadProjects = useCallback(async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }
    }
  }, [router]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await API.get("/projects/summary");
      setSummary(res.data);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }
    }
  }, [router]);

  const loadActivity = useCallback(async () => {
    try {
      const res = await API.get("/projects/activity");
      setActivity(res.data || []);
    } catch {}
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    API.get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      });
    loadProjects();
    loadSummary();
    loadActivity();
  }, [router.isReady, loadProjects, loadSummary, loadActivity, router]);

  const taskBreakdown = useMemo(() => {
    const total = Number(summary?.totalTasks ?? 0);
    if (total <= 0)
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        completed: 0,
        todoPct: 0,
        inProgressPct: 0,
        completedPct: 0,
      };
    const todo = Number(summary.totalTodoTasks ?? 0);
    const inProgress = Number(summary.totalInProgressTasks ?? 0);
    const completed = Number(summary.totalCompletedTasks ?? 0);
    return {
      total,
      todo,
      inProgress,
      completed,
      todoPct: Math.round((todo / total) * 100),
      inProgressPct: Math.round((inProgress / total) * 100),
      completedPct: Math.round((completed / total) * 100),
    };
  }, [summary]);

  if (!user) return null;

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: "#64748b" },
        grid: { color: "rgba(100,116,139,0.06)" },
      },
      y: {
        ticks: { color: "#64748b" },
        grid: { color: "rgba(100,116,139,0.06)" },
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .tab-content { animation: fadeUp 0.2s ease; }
      `}</style>

      <ToastContainer toasts={toasts} />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300 md:relative ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ width: sidebarOpen ? 220 : 64 }}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-cyan-500/20">
            P
          </div>
          {sidebarOpen && (
            <span className="truncate text-sm font-bold text-white">
              Projex<span className="text-cyan-400"></span>
            </span>
          )}
          <button
            className="ml-auto shrink-0 rounded-lg p-1.5 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "<<" : ">>"}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {[
            {
              key: "projects",
              icon: "📁",
              label: "My Projects",
              action: () => router.push("/projects"),
            },
            {
              key: "tasks",
              icon: "✓",
              label: "Tasks",
              action: () => router.push("/deadlines"),
            },
            {
              key: "files",
              icon: "📄",
              label: "Files",
              action: () => router.push("/projects"),
            },
            {
              key: "chat",
              icon: "💬",
              label: "Messages",
              action: () => router.push("/projects"),
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={item.action}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 border border-transparent"
            >
              <span className="shrink-0 text-base leading-none">
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="flex-1 truncate text-left">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-3">
          <div
            className={`flex items-center gap-2.5 ${sidebarOpen ? "" : "justify-center"}`}
          >
            <Avatar name={user.name} size="sm" />
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-600">Member</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={logout}
                className="shrink-0 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-rose-500/10 hover:text-rose-400 transition border border-transparent hover:border-rose-500/20"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950/80 px-3 z-10 sm:gap-4 sm:px-6"
          style={{ backdropFilter: "blur(12px)" }}
        >
          <button
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          <div>
            <h1 className="text-sm font-bold text-white sm:text-base">
              📊 Dashboard
            </h1>
            <p className="hidden text-[11px] text-slate-600 lg:block">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
              onClick={() => router.push("/settings")}
            >
              Settings
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-3 sm:p-6">
            <div className="tab-content space-y-6">
              {/* Welcome Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-500/8 blur-3xl" />
                <div className="absolute right-32 -bottom-8 h-28 w-28 rounded-full bg-violet-500/8 blur-3xl" />
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-500">
                  Member Workspace
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-white">
                  Welcome back, {user.name}!
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Track progress, manage projects, and collaborate with your
                  team.
                </p>
              </div>

              {/* Stats */}
              {summary && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard
                    label="Total Projects"
                    value={summary.totalProjects}
                    icon="📁"
                    accent="bg-cyan-500/20"
                  />
                  <StatCard
                    label="Active Projects"
                    value={summary.totalActiveProjects}
                    icon="🚀"
                    accent="bg-emerald-500/20"
                  />
                  <StatCard
                    label="Tasks Completed"
                    value={summary.totalCompletedTasks}
                    icon="✅"
                    accent="bg-violet-500/20"
                  />
                  <StatCard
                    label="Messages"
                    value={summary.totalMessages}
                    icon="💬"
                    accent="bg-amber-500/20"
                  />
                </div>
              )}

              {/* Charts */}
              {summary && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Project Activity */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <h3 className="mb-4 text-sm font-semibold text-white">
                      Project Activity
                    </h3>
                    <div style={{ height: 280 }}>
                      <Bar
                        data={{
                          labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
                          datasets: [
                            {
                              label: "Tasks",
                              data: [22, 35, 28, 45, 38, 52],
                              backgroundColor: "rgba(34,211,238,0.65)",
                              borderRadius: 5,
                              borderWidth: 0,
                            },
                            {
                              label: "Completed",
                              data: [18, 28, 21, 38, 31, 42],
                              backgroundColor: "rgba(29,233,182,0.55)",
                              borderRadius: 5,
                              borderWidth: 0,
                            },
                          ],
                        }}
                        options={chartOpts}
                      />
                    </div>
                  </div>

                  {/* Task Breakdown */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <h3 className="mb-4 text-sm font-semibold text-white">
                      Task Breakdown
                    </h3>
                    <div style={{ height: 280 }}>
                      <Pie
                        data={{
                          labels: ["Todo", "In Progress", "Completed"],
                          datasets: [
                            {
                              data: [
                                taskBreakdown.todo,
                                taskBreakdown.inProgress,
                                taskBreakdown.completed,
                              ],
                              backgroundColor: [
                                "#f6a623",
                                "#4f9eff",
                                "#1de9b6",
                              ],
                              borderWidth: 0,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: "72%",
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: { color: "#94a3b8" },
                            },
                          },
                        }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="text-center text-xs">
                        <span
                          className="block h-2 w-2 rounded-full mx-auto mb-1"
                          style={{ background: "#f6a623" }}
                        />
                        Todo {taskBreakdown.todoPct}%
                      </div>
                      <div className="text-center text-xs">
                        <span
                          className="block h-2 w-2 rounded-full mx-auto mb-1"
                          style={{ background: "#4f9eff" }}
                        />
                        In Progress {taskBreakdown.inProgressPct}%
                      </div>
                      <div className="text-center text-xs">
                        <span
                          className="block h-2 w-2 rounded-full mx-auto mb-1"
                          style={{ background: "#1de9b6" }}
                        />
                        Done {taskBreakdown.completedPct}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    My Projects
                  </h3>
                  <Badge color="cyan">{projects.length} Projects</Badge>
                </div>
                {projects.length === 0 ? (
                  <div className="rounded-lg border border-slate-800/50 bg-slate-900/30 p-6 text-center">
                    <p className="text-sm text-slate-400">
                      No projects yet. Create one to get started!
                    </p>
                    <button
                      onClick={() => toast("Create new project here", "info")}
                      className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                    >
                      + New Project
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((p) => {
                      const pct =
                        p.task_count > 0
                          ? Math.round(
                              (p.completed_task_count / p.task_count) * 100,
                            )
                          : 0;
                      const statusColor =
                        p.status === "active"
                          ? "green"
                          : p.status === "hold"
                            ? "amber"
                            : "slate";
                      return (
                        <div
                          key={p.id}
                          onClick={() => router.push(`/project/${p.id}`)}
                          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/60"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <h4 className="text-sm font-semibold text-white">
                              {p.title}
                            </h4>
                            <Badge color={statusColor}>{p.status}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mb-3">
                            {p.description || "No description"}
                          </p>
                          {p.task_count > 0 && (
                            <>
                              <div className="mb-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {pct}% complete
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Activity */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  Recent Activity
                </h3>
                {activity.length === 0 ? (
                  <div className="rounded-lg border border-slate-800/50 bg-slate-900/30 p-6 text-center">
                    <p className="text-sm text-slate-400">No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activity.slice(0, 8).map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-slate-800/30 bg-slate-900/20 p-3 hover:bg-slate-900/40 transition cursor-pointer"
                      >
                        <Avatar name={a.user_name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-200">
                            {a.user_name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {a.action?.slice(0, 60)}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-1">
                            2h ago
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
