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
function StatCard({ label, value, icon, trend }) {
  return (
    <div className="group relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-6 shadow-lg hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition duration-300 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition duration-300" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 group-hover:text-slate-300 transition">
              {label}
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {value ?? 0}
              </p>
              {trend && (
                <span
                  className={`text-xs font-semibold ${trend > 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
          <span className="text-3xl group-hover:scale-110 transition duration-300">
            {icon}
          </span>
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

  const loadData = useCallback(async () => {
    try {
      const res = await API.get("/dashboard");
      setDashData(res.data);
    } catch (err) {
      console.error("Dashboard error:", err);
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
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-900/40 p-8 shadow-xl">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                  ✨ Member Workspace
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {user.name}!
                </span>
              </h1>
              <p className="mt-2 text-slate-400 max-w-xl">
                Track your progress, manage tasks, and collaborate with your
                team in one powerful place.
              </p>
            </div>
            <button
              onClick={() => router.push("/projects")}
              className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105 transition duration-300"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Projects"
            value={dashData?.totalProjects}
            icon="📁"
            trend={12}
          />
          <StatCard
            label="Active Tasks"
            value={dashData?.activeTasks}
            icon="🚀"
            trend={8}
          />
          <StatCard
            label="Tasks Completed"
            value={dashData?.taskCompletion?.completed}
            icon="✅"
            trend={15}
          />
          <StatCard
            label="Upcoming Deadlines"
            value={dashData?.upcomingDeadlines}
            icon="📅"
            trend={-5}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Project Activity */}
          <div className="group rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-6 shadow-lg hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  📊 Project Activity
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Performance over the last 6 months
                </p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-cyan-500/10 rounded-lg">
                  <span className="text-xs text-cyan-400 font-semibold">
                    6M
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{ height: "320px" }}
              className="rounded-xl overflow-hidden"
            >
              <Bar data={activityData} options={CHART_OPTS} />
            </div>
          </div>

          {/* Task Breakdown */}
          <div className="group rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-6 shadow-lg hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition duration-300">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    📈 Task Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="text-cyan-400 font-semibold">
                      {dashData?.taskCompletion?.total}
                    </span>{" "}
                    total tasks
                  </p>
                </div>
              </div>
            </div>
            <div
              style={{ height: "320px" }}
              className="flex items-center justify-center"
            >
              <div className="relative w-full">
                <Doughnut data={taskBreakdownData} options={DONUT_OPTS} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {taskPercent}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                🎯 Recent Projects
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your active and recent collaborations
              </p>
            </div>
            <button
              onClick={() => router.push("/projects")}
              className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold transition hover:gap-2 flex items-center"
            >
              View all <span>→</span>
            </button>
          </div>

          {dashData?.recentProjects?.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-5xl mb-3">🚀</p>
              <p className="text-slate-400 text-sm font-semibold">
                No projects yet
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Start by creating your first project to begin collaborating!
              </p>
              <button
                onClick={() => router.push("/projects")}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition duration-300 text-sm"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dashData?.recentProjects?.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="group flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 hover:border-cyan-500/40 hover:bg-slate-800/50 hover:shadow-md hover:shadow-cyan-500/10 transition duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📌</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white group-hover:text-cyan-300 transition truncate">
                          {project.title}
                        </p>
                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            📋 {project.task_count} tasks
                          </span>
                          <span className="flex items-center gap-1">
                            👥 {project.member_count} member
                            {project.member_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="ml-3 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 font-semibold rounded-lg hover:from-cyan-500/40 hover:to-blue-500/40 hover:border-cyan-500/60 transition duration-300 text-sm whitespace-nowrap"
                  >
                    Open →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
