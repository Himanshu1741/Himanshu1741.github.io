/**
 * User Dashboard Page - Clean & Simple
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

const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), {
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

// Chart options
const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        color: "#94a3b8",
        font: { size: 12, weight: 600 },
        padding: 15,
        usePointStyle: true,
        boxWidth: 10,
      },
    },
    filler: {
      propagate: true,
    },
  },
  scales: {
    x: {
      ticks: { color: "#64748b", font: { size: 11 } },
      grid: { color: "rgba(100,116,139,0.1)", drawBorder: false },
      border: { display: false },
    },
    y: {
      ticks: { color: "#64748b", font: { size: 11 } },
      grid: { color: "rgba(100,116,139,0.1)", drawBorder: false },
      border: { display: false },
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
      labels: {
        color: "#94a3b8",
        usePointStyle: true,
        boxWidth: 10,
        font: { size: 12, weight: 600 },
        padding: 15,
      },
    },
  },
};

// --- Stat Card ---
function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700">
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

// --- Main Dashboard ---
export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      console.log("🔄 Loading dashboard data...");
      const res = await API.get("/dashboard");
      console.log("✅ Dashboard data loaded:", res.data);
      setDashData(res.data);
    } catch (err) {
      console.error("❌ Dashboard error:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load dashboard",
      );
      setDashData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount effect - runs only on client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user and dashboard data after mount
  useEffect(() => {
    if (!mounted) return;

    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    setUser(parsed);

    if (!parsed) {
      router.push("/login");
      return;
    }

    loadData();
  }, [mounted, router, loadData]);

  if (!mounted || !user || loading || !dashData) {
    if (error) {
      return (
        <AppLayout>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="text-5xl">⚠️</div>
              <p className="text-slate-300 font-semibold text-center max-w-md">
                Failed to load dashboard
              </p>
              <p className="text-slate-500 text-sm text-center max-w-md">
                {error}
              </p>
              <button
                onClick={loadData}
                className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium rounded-lg transition"
              >
                🔄 Try Again
              </button>
              <p className="text-xs text-slate-600 mt-4">
                Check browser console for details (F12)
              </p>
            </div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-slate-400 font-semibold">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const taskPercent =
    dashData?.taskCompletion?.total > 0
      ? Math.round(
          (dashData.taskCompletion.completed / dashData.taskCompletion.total) *
            100,
        )
      : 0;

  // Activity data (mock: last 6 months)
  const activityData = {
    labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    datasets: [
      {
        label: "✅ Completed",
        data: [12, 19, 25, 35, 28, 40],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 0,
        borderRadius: 8,
        hoverBackgroundColor: "rgba(16, 185, 129, 1)",
      },
      {
        label: "🔄 In Progress",
        data: [8, 12, 18, 22, 20, 25],
        backgroundColor: "rgba(34, 211, 238, 0.8)",
        borderColor: "rgba(34, 211, 238, 1)",
        borderWidth: 0,
        borderRadius: 8,
        hoverBackgroundColor: "rgba(34, 211, 238, 1)",
      },
    ],
  };

  // Task breakdown
  const taskBreakdownData = {
    labels: ["✅ Done", "🔄 In progress", "📝 Todo"],
    datasets: [
      {
        data: [
          dashData?.taskCompletion?.completed || 0,
          Math.ceil((dashData?.taskCompletion?.total || 0) / 3),
          Math.floor((dashData?.taskCompletion?.total || 0) / 3),
        ],
        backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Welcome Section */}
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
            Here is an overview of your projects and activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Projects"
            value={dashData?.totalProjects}
            icon="📁"
            accent="bg-cyan-500/20"
          />
          <StatCard
            label="Active Tasks"
            value={dashData?.activeTasks}
            icon="🚀"
            accent="bg-emerald-500/20"
          />
          <StatCard
            label="Tasks Completed"
            value={dashData?.taskCompletion?.completed}
            icon="✅"
            accent="bg-violet-500/20"
          />
          <StatCard
            label="Upcoming Deadlines"
            value={dashData?.upcomingDeadlines}
            icon="📅"
            accent="bg-rose-500/20"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Project Activity */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Project Activity
              </p>
              <span className="text-xs text-slate-600">Last 6 months</span>
            </div>
            <div style={{ height: "300px" }}>
              <Bar data={activityData} options={CHART_OPTS} />
            </div>
          </div>

          {/* Task Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">Task Breakdown</p>
              <p className="mt-1 text-[11px] text-slate-600">
                {dashData?.taskCompletion?.total} total tasks
              </p>
            </div>
            <div
              style={{ height: "300px" }}
              className="flex items-center justify-center"
            >
              <div className="relative w-full">
                <Doughnut data={taskBreakdownData} options={DONUT_OPTS} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">
                      {taskPercent}%
                    </p>
                    <p className="text-xs text-slate-600">complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Recent Projects</p>
            <button
              onClick={() => router.push("/projects")}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
            >
              View all
            </button>
          </div>

          {dashData?.recentProjects?.length === 0 ? (
            <p className="text-xs text-slate-600">
              No projects yet. Start by creating your first project!
            </p>
          ) : (
            <div className="space-y-0">
              {dashData?.recentProjects?.slice(0, 5).map((project, i) => {
                const isLast =
                  i === Math.min(4, dashData.recentProjects.length - 1);
                return (
                  <div
                    key={project.id}
                    className={`flex items-start justify-between gap-3 py-3 ${!isLast ? "border-b border-slate-800/60" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {project.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {project.task_count} tasks • {project.member_count}{" "}
                        member{project.member_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/project/${project.id}`)}
                      className="shrink-0 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                    >
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
