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
    legend: { display: true, labels: { color: "#94a3b8" } },
  },
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

// --- Stat Card ---
function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-slate-700 transition">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-4xl font-extrabold text-white">{value ?? 0}</p>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

// --- Main Dashboard ---
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : null;
    setUser(parsed);

    if (!parsed) {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

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

  if (!user || loading || !dashData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-500">Loading...</p>
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
        label: "Completed",
        data: [12, 19, 25, 35, 28, 40],
        backgroundColor: "#22d3ee",
        borderRadius: 8,
      },
      {
        label: "In Progress",
        data: [8, 12, 18, 22, 20, 25],
        backgroundColor: "#10b981",
        borderRadius: 8,
      },
    ],
  };

  // Task breakdown
  const taskBreakdownData = {
    labels: ["Done", "In progress", "Todo"],
    datasets: [
      {
        data: [
          dashData?.taskCompletion?.completed || 0,
          Math.ceil((dashData?.taskCompletion?.total || 0) / 3),
          Math.floor((dashData?.taskCompletion?.total || 0) / 3),
        ],
        backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500">
              MEMBER WORKSPACE
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              Welcome back, {user.name}!
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Track progress, manage tasks, and collaborate in one place.
            </p>
          </div>
          <button
            onClick={() => router.push("/projects")}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition whitespace-nowrap ml-4"
          >
            + New project
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Projects"
            value={dashData?.totalProjects}
            icon="📁"
          />
          <StatCard
            label="Active Projects"
            value={dashData?.activeTasks > 0 ? 1 : 0}
            icon="🚀"
          />
          <StatCard
            label="Tasks Completed"
            value={dashData?.taskCompletion?.completed}
            icon="✅"
          />
          <StatCard label="Messages" value={6} icon="💬" />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Project Activity */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Project Activity
              </h3>
              <span className="text-xs text-slate-500">Last 6 months</span>
            </div>
            <div style={{ height: "300px" }}>
              <Bar data={activityData} options={CHART_OPTS} />
            </div>
          </div>

          {/* Task Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
                Task Breakdown
              </h3>
              <p className="mt-1 text-xs text-slate-500">
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
                    <p className="text-xs text-slate-500">complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Recent Projects
            </h3>
            <button
              onClick={() => router.push("/projects")}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition"
            >
              View all →
            </button>
          </div>

          {dashData?.recentProjects?.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-500 text-sm">
                No projects yet. Start by creating your first project!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashData?.recentProjects?.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/30 p-4 hover:border-slate-700 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-white">{project.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {project.task_count} tasks • {project.member_count} member
                      {project.member_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="ml-2 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition"
                  >
                    Open
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
