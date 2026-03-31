/**
 * Dashboard Page
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NewUserGuide from "../components/common/NewUserGuide";
import AppLayout from "../components/layout/AppLayout";
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
  const c = {
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
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm ${c[t.type]}`}
          style={{
            pointerEvents: "auto",
            animation: "slideInRight 0.25s ease",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
        <p className="mb-5 text-sm text-slate-400">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-rose-500 hover:bg-rose-400 px-4 py-2 text-sm font-semibold text-white transition"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-950 p-6 backdrop-blur">
      <div
        className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl opacity-25 ${accent}`}
      />
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-4xl font-extrabold text-white">{value ?? 0}</p>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
    </div>
  );
}

function ProjectCard({ project, user, onOpen, onDelete }) {
  const pct =
    project.task_count > 0
      ? Math.round((project.completed_task_count / project.task_count) * 100)
      : 0;
  const canDelete =
    user && (user.id === project.created_by || user.role === "admin");

  const statusColor =
    {
      active: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    }[project.status] || "bg-slate-700/30 text-slate-300 border-slate-600/30";

  return (
    <div className="group rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 backdrop-blur transition hover:border-slate-600 hover:bg-slate-900/60">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-lg font-bold text-slate-50 group-hover:text-white transition">
            {project.title}
          </h4>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">
            {project.description || "No description provided"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusColor}`}
        >
          {project.status}
        </span>
      </div>

      {project.task_count > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              {project.completed_task_count} / {project.task_count} tasks
            </p>
            <p className="text-xs font-semibold text-slate-300">{pct}%</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onOpen}
          className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-2 text-sm font-semibold text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 transition"
        >
          Open Project
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function DeadlineItem({ task, projectTitle }) {
  const daysUntil = Math.ceil(
    (new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysUntil < 0;
  const isToday = daysUntil === 0;
  const isSoon = daysUntil > 0 && daysUntil <= 3;

  const dateColor = isOverdue
    ? "text-rose-400"
    : isToday
      ? "text-amber-400"
      : isSoon
        ? "text-orange-400"
        : "text-slate-400";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/50 bg-slate-900/30 px-3 py-2.5 backdrop-blur">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">
          {task.title}
        </p>
        <p className="text-xs text-slate-500">{projectTitle}</p>
      </div>
      <span
        className={`shrink-0 whitespace-nowrap text-xs font-semibold ${dateColor}`}
      >
        {isOverdue
          ? `${Math.abs(daysUntil)}d overdue`
          : isToday
            ? "Today"
            : isSoon
              ? `${daysUntil}d left`
              : `${daysUntil}d`}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [projectQuery, setProjectQuery] = useState("");
  const [projectSlide, setProjectSlide] = useState("active");
  const [pageError, setPageError] = useState("");
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const { toasts, toast } = useToast();
  const createProjectRef = useRef(null);
  const router = useRouter();

  const ask = (title, message, onConfirm) =>
    setConfirm({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));

  const loadProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
      setPageError("");
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }
      setPageError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load projects",
      );
    }
  };

  const loadSummary = async () => {
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
  };

  const loadActivity = async () => {
    try {
      const res = await API.get("/projects/activity");
      setActivity(res.data || []);
    } catch {}
  };

  const loadUpcomingTasks = async () => {
    try {
      const res = await API.get("/tasks/upcoming");
      setUpcomingTasks(res.data || []);
    } catch {}
  };

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
    const isAdminPreviewMode = router.query.preview === "member";
    API.get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.user?.role === "admin" && !isAdminPreviewMode)
          router.push("/admin");
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      });
    loadProjects();
    loadSummary();
    loadActivity();
    loadUpcomingTasks();
  }, [router.isReady, router.query.preview]);

  const createProject = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Project title is required", "warning");
      return;
    }
    try {
      await API.post("/projects", form);
      setForm({ title: "", description: "" });
      await loadProjects();
      await loadSummary();
      toast("Project created!", "success");
    } catch (err) {
      toast(
        err?.response?.data?.message || "Failed to create project",
        "error",
      );
    }
  };

  const deleteProject = async (project) => {
    ask(
      "Delete Project",
      `Delete "${project.title}"? This cannot be undone.`,
      async () => {
        closeConfirm();
        try {
          await API.delete(`/projects/${project.id}`);
          await loadProjects();
          await loadSummary();
          toast(`"${project.title}" deleted`, "success");
        } catch (err) {
          toast(err?.response?.data?.message || "Delete failed", "error");
        }
      },
    );
  };

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase();
    const searched = !q
      ? projects
      : projects.filter((p) =>
          `${p.title} ${p.description || ""}`.toLowerCase().includes(q),
        );
    return projectSlide === "completed"
      ? searched.filter((p) => p.status === "completed")
      : searched.filter((p) => p.status !== "completed");
  }, [projects, projectQuery, projectSlide]);

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

  const scrollToCreateProject = () =>
    createProjectRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

  const findProject = (value) => {
    const key = String(value || "").trim();
    if (!key) return null;
    const lk = key.toLowerCase();
    return (
      projects.find((p) => String(p.id) === key) ||
      projects.find((p) => String(p.title || "").toLowerCase() === lk) ||
      projects.find((p) =>
        String(p.title || "")
          .toLowerCase()
          .includes(lk),
      ) ||
      null
    );
  };

  const executeGuideCommand = async (command) => {
    if (!command?.type) return { message: "Unknown command." };
    if (command.type === "help")
      return {
        message:
          "Commands: help, list projects, create project <title> | <description>, open project <id|title>, delete project <id|title>, complete project <id|title>, activate project <id|title>, rename project <id|title> | <new title>, update project description <id|title> | <desc>, show active projects, show completed projects, search project <text>, clear search, go to create project, open settings, open dashboard, open admin, logout.",
      };
    if (command.type === "list_projects") {
      if (!projects.length) return { message: "No projects found." };
      return {
        message: `Projects (${projects.length}): ${projects
          .slice(0, 8)
          .map((p) => `${p.id}: ${p.title}`)
          .join(", ")}`,
      };
    }
    if (command.type === "create_project") {
      const title = String(command.title || "").trim();
      const description = String(command.description || "").trim();
      if (!title)
        return {
          message: "Provide a title. Example: create project Demo App | Setup",
        };
      try {
        await API.post("/projects", { title, description });
        await loadProjects();
        await loadSummary();
        return {
          message: `Project "${title}" created.`,
          actions: [
            { label: "Go to Dashboard", type: "route", path: "/dashboard" },
          ],
        };
      } catch (error) {
        return {
          message: error?.response?.data?.message || "Failed to create.",
        };
      }
    }
    if (command.type === "open_settings") {
      router.push("/settings");
      return { message: "Opening settings..." };
    }
    if (command.type === "open_dashboard") {
      router.push("/dashboard");
      return { message: "Opening dashboard..." };
    }
    if (command.type === "open_admin") {
      if (user?.role !== "admin") return { message: "Admin access required." };
      router.push("/admin");
      return { message: "Opening admin..." };
    }
    if (command.type === "go_create_project") {
      scrollToCreateProject();
      return { message: "Jumped to Create Project section." };
    }
    if (command.type === "show_projects") {
      setProjectSlide(command.status === "completed" ? "completed" : "active");
      return {
        message: `Showing ${command.status === "completed" ? "completed" : "active"} projects.`,
      };
    }
    if (command.type === "search_project") {
      setProjectQuery(String(command.query || "").trim());
      return {
        message: command.query
          ? `Searching for "${command.query}".`
          : "Search cleared.",
      };
    }
    if (command.type === "clear_search") {
      setProjectQuery("");
      return { message: "Search cleared." };
    }
    if (command.type === "open_project") {
      const p = findProject(String(command.project || "").trim());
      if (p) {
        router.push(`/project/${p.id}`);
        return { message: `Opening "${p.title}"...` };
      }
      return { message: `No project found for "${command.project}".` };
    }
    if (command.type === "open_project_settings") {
      const p = findProject(String(command.project || "").trim());
      if (!p) return { message: `No project found for "${command.project}".` };
      router.push(`/project/${p.id}/settings`);
      return { message: `Opening settings for "${p.title}"...` };
    }
    if (command.type === "delete_project") {
      const p = findProject(String(command.project || "").trim());
      if (!p) return { message: `No project found for "${command.project}".` };
      if (!user || (user.id !== p.created_by && user.role !== "admin"))
        return { message: "No permission to delete." };
      try {
        await API.delete(`/projects/${p.id}`);
        await loadProjects();
        await loadSummary();
        return { message: `"${p.title}" deleted.` };
      } catch (error) {
        return { message: error?.response?.data?.message || "Delete failed." };
      }
    }
    if (command.type === "set_project_status") {
      const p = findProject(String(command.project || "").trim());
      if (!p) return { message: `No project found.` };
      try {
        await API.put(`/projects/${p.id}/status`, { status: command.status });
        await loadProjects();
        await loadSummary();
        return { message: `"${p.title}" marked as ${command.status}.` };
      } catch (error) {
        return { message: error?.response?.data?.message || "Failed." };
      }
    }
    if (command.type === "rename_project") {
      const p = findProject(command.project);
      const t = String(command.title || "").trim();
      if (!p) return { message: `No project found.` };
      if (!t) return { message: "New title required." };
      try {
        await API.put(`/projects/${p.id}`, {
          title: t,
          description: p.description || "",
        });
        await loadProjects();
        return { message: `Renamed to "${t}".` };
      } catch (error) {
        return { message: error?.response?.data?.message || "Rename failed." };
      }
    }
    if (command.type === "update_project_description") {
      const p = findProject(command.project);
      const desc = String(command.description || "").trim();
      if (!p) return { message: `No project found.` };
      try {
        await API.put(`/projects/${p.id}`, {
          title: p.title,
          description: desc,
        });
        await loadProjects();
        return { message: `Description updated for "${p.title}".` };
      } catch (error) {
        return { message: error?.response?.data?.message || "Failed." };
      }
    }
    if (command.type === "logout") {
      logout();
      return { message: "Logging out..." };
    }
    return { message: "Command not supported yet." };
  };

  const pieOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#94a3b8", usePointStyle: true, boxWidth: 8 },
      },
    },
  };
  const barOpts = {
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

  if (!user) return null;

  return (
    <>
      <style>{`@keyframes slideInRight { from{opacity:0;transform:translateX(20px);} to{opacity:1;transform:translateX(0);} }`}</style>
      <ToastContainer toasts={toasts} />
      <ConfirmModal {...confirm} onCancel={closeConfirm} />
      <AppLayout user={user} activeTab="dashboard" onLogout={logout}>
        <div className="space-y-6">
          {/* Welcome & Quick Actions Header */}
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 p-8">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="absolute right-40 -bottom-12 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="relative z-10">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                  Welcome Back
                </p>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">
                  {user.name}
                </h1>
                <p className="mt-2 max-w-lg text-base text-slate-400">
                  Track projects, manage tasks, and collaborate with your team
                  all in one place.
                </p>
              </div>
            </div>
          </div>

          {pageError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {pageError}
            </div>
          )}

          <NewUserGuide
            user={user}
            projects={projects}
            onCreateProject={scrollToCreateProject}
            onExecuteCommand={executeGuideCommand}
          />

          {/* Projects Section - Prioritized at Top */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">My Projects</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {filteredProjects.length} {projectSlide} project
                  {filteredProjects.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                  onClick={() => router.push("/trash")}
                >
                  🗑 Trash
                </button>
                <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/50 p-1.5 gap-1">
                  <button
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      projectSlide === "active"
                        ? "bg-cyan-500/25 text-cyan-300 shadow-lg shadow-cyan-500/20"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                    onClick={() => setProjectSlide("active")}
                  >
                    Active
                  </button>
                  <button
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      projectSlide === "completed"
                        ? "bg-emerald-500/25 text-emerald-300 shadow-lg shadow-emerald-500/20"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                    onClick={() => setProjectSlide("completed")}
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>

            <input
              className="input-modern mb-5 w-full"
              placeholder="🔍 Search projects..."
              value={projectQuery}
              onChange={(e) => setProjectQuery(e.target.value)}
            />

            {filteredProjects.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-700 py-12 text-center">
                <p className="text-sm text-slate-500">
                  No {projectSlide} projects found.
                </p>
                <button
                  onClick={scrollToCreateProject}
                  className="mt-3 inline-block text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Create your first project →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    user={user}
                    onOpen={() => router.push(`/project/${project.id}`)}
                    onDelete={() => deleteProject(project)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* KPI Row */}
          {summary && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Projects"
                value={summary.totalProjects}
                accent="bg-cyan-500"
              />
              <StatCard
                label="Active Projects"
                value={summary.totalActiveProjects}
                accent="bg-blue-500"
              />
              <StatCard
                label="Completed Tasks"
                value={summary.totalCompletedTasks}
                accent="bg-emerald-500"
              />
              <StatCard
                label="Total Messages"
                value={summary.totalMessages}
                accent="bg-violet-500"
              />
            </div>
          )}

          {/* Upcoming Deadlines */}
          {upcomingTasks && upcomingTasks.length > 0 && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-lg">
                  📅
                </div>
                <h3 className="text-lg font-bold text-white">
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {upcomingTasks.map((task) => (
                  <DeadlineItem
                    key={task.id}
                    task={task}
                    projectTitle={
                      projects.find((p) => p.id === task.project_id)?.title ||
                      "Project"
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Charts Row */}
          {summary && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
                <h3 className="mb-4 text-lg font-bold text-white">
                  📊 Task Breakdown
                </h3>
                <div className="h-52">
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
                          backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e"],
                          borderWidth: 0,
                        },
                      ],
                    }}
                    options={pieOpts}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-amber-500/15 py-2 text-amber-300 font-semibold">
                    Todo {taskBreakdown.todoPct}%
                  </div>
                  <div className="rounded-lg bg-blue-500/15 py-2 text-blue-300 font-semibold">
                    Progress {taskBreakdown.inProgressPct}%
                  </div>
                  <div className="rounded-lg bg-emerald-500/15 py-2 text-emerald-300 font-semibold">
                    Done {taskBreakdown.completedPct}%
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
                <h3 className="mb-4 text-lg font-bold text-white">
                  📈 Project Activity
                </h3>
                <div className="h-52">
                  <Bar
                    data={{
                      labels: [
                        "Projects",
                        "Active",
                        "Completed",
                        "Tasks",
                        "Files",
                        "Messages",
                      ],
                      datasets: [
                        {
                          data: [
                            summary.totalProjects,
                            summary.totalActiveProjects ?? 0,
                            summary.totalCompletedProjects ?? 0,
                            summary.totalTasks,
                            summary.totalFiles,
                            summary.totalMessages,
                          ],
                          backgroundColor: [
                            "#06b6d4",
                            "#3b82f6",
                            "#22c55e",
                            "#6366f1",
                            "#f59e0b",
                            "#f43f5e",
                          ],
                          borderRadius: 8,
                          borderWidth: 0,
                        },
                      ],
                    }}
                    options={barOpts}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          {activity.length > 0 && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-lg">
                  ⚡
                </div>
                <h3 className="text-lg font-bold text-white">Team Activity</h3>
              </div>
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {activity.map((a, i) => {
                  const diff = (Date.now() - new Date(a.created_at)) / 1000;
                  const timeAgo =
                    diff < 60
                      ? "just now"
                      : diff < 3600
                        ? `${Math.floor(diff / 60)}m ago`
                        : diff < 86400
                          ? `${Math.floor(diff / 3600)}h ago`
                          : `${Math.floor(diff / 86400)}d ago`;
                  const initials = (a.user_name || "?")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const GRADS = [
                    "from-cyan-500 to-blue-500",
                    "from-violet-500 to-purple-500",
                    "from-amber-500 to-orange-500",
                    "from-emerald-500 to-teal-500",
                  ];
                  return (
                    <div
                      key={a.id ?? i}
                      className="flex items-start gap-3 rounded-xl border border-slate-800/50 bg-slate-900/30 px-3 py-2.5 hover:border-slate-700/50 transition"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${GRADS[i % GRADS.length]}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-slate-200">
                          {a.action}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {a.user_name} · {timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create Project Section */}
          <div
            ref={createProjectRef}
            className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur"
          >
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-lg">
                ✨
              </div>
              <h3 className="text-lg font-bold text-white">
                Start a New Project
              </h3>
            </div>
            <form onSubmit={createProject} className="grid gap-3 max-w-2xl">
              <input
                className="input-modern"
                placeholder="Project title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="input-modern min-h-[100px] resize-none"
                placeholder="Project description (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <button type="submit" className="btn-primary w-fit">
                Create Project
              </button>
            </form>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
