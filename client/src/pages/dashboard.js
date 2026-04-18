/**
 * User Dashboard Page
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import API from "../services/api";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), {
  ssr: false,
});
const Doughnut = dynamic(
  () => import("react-chartjs-2").then((m) => m.Doughnut),
  { ssr: false },
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

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
  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
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
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[color]}`}
    >
      {children}
    </span>
  );
}

// --- Stat Card ---
function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div
      className={`dashboard-stat-card relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700`}
    >
      <div
        className={`absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl opacity-20 ${accent}`}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="dashboard-stat-label text-[11px] font-medium uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <p
            className={`dashboard-stat-value mt-2 text-3xl font-extrabold tracking-tight text-white`}
          >
            {value ?? 0}
          </p>
          {sub && (
            <p className="dashboard-stat-sub mt-1 text-[11px] text-slate-600">
              {sub}
            </p>
          )}
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

// --- Avatar ---
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

// --- Chart options ---
const CHART_OPTS = {
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

const LINE_OPTS = {
  ...CHART_OPTS,
  plugins: {
    legend: {
      display: true,
      labels: { color: "#94a3b8", usePointStyle: true, boxWidth: 8 },
    },
  },
};

const DONUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  plugins: {
    legend: {
      position: "bottom",
      labels: { color: "#94a3b8", usePointStyle: true, boxWidth: 8 },
    },
  },
};

// --- Time formatting utilities ---
function timeAgo(date) {
  if (!date) return null;
  const d = Math.floor((Date.now() - new Date(date)) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function daysUntil(date) {
  if (!date) return null;
  const d = Math.ceil((new Date(date) - Date.now()) / 86400000);
  if (d < 0) return "Overdue";
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `${d} days`;
}

// --- Main Dashboard Component ---
export default function Dashboard() {
  const router = useRouter();
  const { toasts, toast } = useToast();

  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/dashboard");
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      toast("Failed to load dashboard data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    setUser(parsed);

    if (!parsed) {
      router.push("/login");
      return;
    }

    loadDashboard();
  }, [router, loadDashboard]);

  if (!user || !dashboardData) return null;

  // Prepare chart data
  const taskCompletionData = dashboardData?.taskCompletion
    ? {
        labels: ["Completed", "Remaining"],
        datasets: [
          {
            data: [
              dashboardData.taskCompletion.completed,
              dashboardData.taskCompletion.total -
                dashboardData.taskCompletion.completed,
            ],
            backgroundColor: ["#10b981", "#1e293b"],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      }
    : null;

  const taskPct =
    dashboardData?.taskCompletion?.total > 0
      ? Math.round(
          (dashboardData.taskCompletion.completed /
            dashboardData.taskCompletion.total) *
            100,
        )
      : 0;

  const activityChartData = dashboardData?.activityTrend
    ? {
        labels: dashboardData.activityTrend.map((a) => a.date) || [],
        datasets: [
          {
            label: "Tasks Completed",
            data: dashboardData.activityTrend.map((a) => Number(a.count)) || [],
            borderColor: "#22d3ee",
            backgroundColor: "rgba(34,211,238,0.08)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#22d3ee",
          },
        ],
      }
    : null;

  return (
    <AppLayout>
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .dashboard-content { animation: fadeUp 0.2s ease; }
      `}</style>

      <ToastContainer toasts={toasts} />

      <div className="dashboard-content">
        {/* Welcome Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-500/8 blur-3xl" />
          <div className="absolute right-32 -bottom-8 h-28 w-28 rounded-full bg-violet-500/8 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-500">
              Welcome Back
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Hey {user.name}! 👋
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Here's your project activity overview for today.{" "}
              <span className="text-slate-600">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="My Projects"
            value={dashboardData?.totalProjects}
            icon="📁"
            accent="bg-cyan-500/20"
          />
          <StatCard
            label="Active Tasks"
            value={dashboardData?.activeTasks}
            icon="✓"
            accent="bg-emerald-500/20"
          />
          <StatCard
            label="Upcoming"
            value={dashboardData?.upcomingDeadlines}
            icon="📅"
            accent="bg-amber-500/20"
          />
          <StatCard
            label="Completion"
            value={`${taskPct}%`}
            icon="🎯"
            accent="bg-violet-500/20"
            sub={`${dashboardData?.taskCompletion?.completed || 0}/${dashboardData?.taskCompletion?.total || 0} tasks`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Projects & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Projects */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Recent Projects
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Your active projects
                  </p>
                </div>
                <button
                  onClick={() => router.push("/projects")}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
                >
                  View all →
                </button>
              </div>

              {dashboardData?.recentProjects?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-slate-500">No projects yet</p>
                  <button
                    onClick={() => router.push("/projects")}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Create your first project
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.recentProjects?.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/30 p-3 hover:border-slate-700 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {project.title}
                          </p>
                          {project.status === "active" ? (
                            <Badge color="cyan">Active</Badge>
                          ) : (
                            <Badge color="slate">Completed</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {project.description || "No description"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          {project.task_count} tasks • {project.member_count}{" "}
                          member
                          {project.member_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/project/${project.id}`)}
                        className="ml-2 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-white">
                  Recent Activity
                </p>
                <p className="text-[11px] text-slate-600">Your latest work</p>
              </div>

              {dashboardData?.recentActivity?.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-0">
                  {dashboardData?.recentActivity
                    ?.slice(0, 8)
                    .map((entry, i) => {
                      const isLast =
                        i ===
                        Math.min(
                          7,
                          (dashboardData?.recentActivity?.length || 1) - 1,
                        );
                      const actionColor =
                        {
                          CREATED_PROJECT: "text-cyan-400",
                          UPDATED_PROJECT: "text-blue-400",
                          CREATED_TASK: "text-emerald-400",
                          COMPLETED_TASK: "text-emerald-400",
                          ADDED_COMMENT: "text-violet-400",
                          JOINED_PROJECT: "text-amber-400",
                          LEFT_PROJECT: "text-rose-400",
                        }[entry.action] || "text-slate-400";
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-start gap-3 py-2.5 ${!isLast ? "border-b border-slate-800/60" : ""}`}
                        >
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-xs font-bold ${actionColor}`}
                              >
                                {entry.action.replace(/_/g, " ")}
                              </span>
                              {entry.target && (
                                <span className="text-xs text-slate-400">
                                  → {entry.target}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600">
                              {timeAgo(entry.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Charts & Deadlines */}
          <div className="space-y-6">
            {/* Task Completion Chart */}
            {taskCompletionData && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-white">
                    Task Progress
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {taskPct}% completed
                  </p>
                </div>
                <div style={{ height: "200px" }}>
                  <Doughnut data={taskCompletionData} options={DONUT_OPTS} />
                </div>
              </div>
            )}

            {/* Upcoming Deadlines */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-white">
                  Upcoming Deadlines
                </p>
                <p className="text-[11px] text-slate-600">
                  Next {dashboardData?.upcomingDeadlines} deadline
                  {(dashboardData?.upcomingDeadlines || 0) !== 1 ? "s" : ""}
                </p>
              </div>

              {dashboardData?.deadlines?.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">
                  No upcoming deadlines
                </p>
              ) : (
                <div className="space-y-2">
                  {dashboardData?.deadlines?.slice(0, 5).map((deadline) => {
                    const daysLeft = Math.ceil(
                      (new Date(deadline.deadline) - Date.now()) / 86400000,
                    );
                    const isOverdue = daysLeft < 0;
                    const isUrgent = daysLeft <= 3 && daysLeft >= 0;

                    return (
                      <div
                        key={deadline.id}
                        className={`rounded-lg border px-3 py-2.5 text-xs ${
                          isOverdue
                            ? "border-rose-500/30 bg-rose-500/10"
                            : isUrgent
                              ? "border-amber-500/30 bg-amber-500/10"
                              : "border-slate-800 bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-semibold truncate ${isOverdue ? "text-rose-300" : isUrgent ? "text-amber-300" : "text-slate-300"}`}
                            >
                              {deadline.title}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-600 truncate">
                              {deadline.project}
                            </p>
                          </div>
                          <Badge
                            color={
                              isOverdue ? "red" : isUrgent ? "amber" : "cyan"
                            }
                          >
                            {daysUntil(deadline.deadline)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="mb-3 text-sm font-semibold text-white">
                Quick Actions
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/projects")}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  📁 Browse Projects
                </button>
                <button
                  onClick={() => router.push("/deadlines")}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  📅 View Deadlines
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  👤 My Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Trend Chart */}
        {activityChartData && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">Activity Trend</p>
              <p className="text-[11px] text-slate-600">
                Your task completion over time
              </p>
            </div>
            <div style={{ height: "300px" }}>
              <Line data={activityChartData} options={LINE_OPTS} />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
