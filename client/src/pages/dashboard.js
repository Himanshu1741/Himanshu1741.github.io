/**
 * Dashboard Page - Modern Design
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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

// Color scheme
const colors = {
  bg0: "#0c0d12",
  bg1: "#13141b",
  bg2: "#1a1c25",
  bg3: "#21242f",
  cyan: "#00d4ff",
  mint: "#1de9b6",
  violet: "#9d78ff",
  amber: "#f6a623",
  rose: "#ff5c7c",
  blue: "#4f9eff",
};

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
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-modal-confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCardModern({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card-accent" style={{ background: accent }} />
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value" style={{ color: accent }}>
        {value ?? 0}
      </span>
    </div>
  );
}

const CardModern = React.forwardRef(({ title, note, pill, children }, ref) => (
  <div ref={ref} className="card-modern">
    <div className="card-modern-header">
      <span className="card-modern-title">{title}</span>
      {pill && <span className="card-modern-pill">{pill}</span>}
      {note && <span className="card-modern-note">{note}</span>}
    </div>
    {children}
  </div>
));

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
      <ToastContainer toasts={toasts} />
      <ConfirmModal {...confirm} onCancel={closeConfirm} />
      <div className="dashboard-container">
        {/* Top Navigation */}
        <nav className="dashboard-nav">
          <div className="nav-brand">
            <div className="nav-brand-icon">P</div>
            <span className="nav-brand-text">Projex</span>
          </div>
          <div className="nav-user">
            <div className="nav-user-avatar">
              {user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div>
              <p className="welcome-banner-label">Member workspace</p>
              <h3 className="welcome-banner-title">
                Welcome back, {user.name}!
              </h3>
              <p className="welcome-banner-subtitle">
                Track progress, manage tasks, and collaborate in one place.
              </p>
            </div>
            <button
              onClick={scrollToCreateProject}
              className="welcome-banner-btn"
            >
              + New project
            </button>
          </div>

          {pageError && <div className="error-alert">{pageError}</div>}

          {/* KPI Stats */}
          <div className="kpi-grid">
            {summary && (
              <>
                <StatCardModern
                  label="Total projects"
                  value={summary.totalProjects}
                  accent={colors.cyan}
                />
                <StatCardModern
                  label="Active projects"
                  value={summary.totalActiveProjects}
                  accent={colors.blue}
                />
                <StatCardModern
                  label="Tasks completed"
                  value={summary.totalCompletedTasks}
                  accent={colors.mint}
                />
                <StatCardModern
                  label="Messages"
                  value={summary.totalMessages}
                  accent={colors.violet}
                />
              </>
            )}
          </div>

          {/* Charts Row */}
          {summary && (
            <div className="charts-row">
              <CardModern title="Project activity" note="Last 6 months">
                <div className="chart-container">
                  <Bar
                    data={{
                      labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
                      datasets: [
                        {
                          label: "Tasks",
                          data: [22, 35, 28, 45, 38, 52],
                          backgroundColor: `rgba(0, 212, 255, 0.65)`,
                          borderRadius: 5,
                          borderWidth: 0,
                        },
                        {
                          label: "Completed",
                          data: [18, 28, 21, 38, 31, 42],
                          backgroundColor: `rgba(29, 233, 182, 0.55)`,
                          borderRadius: 5,
                          borderWidth: 0,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          ticks: { color: "#484f66", font: { size: 10 } },
                          grid: { color: "rgba(255,255,255,.03)" },
                          border: { display: false },
                        },
                        y: {
                          ticks: { color: "#484f66", font: { size: 10 } },
                          grid: { color: "rgba(255,255,255,.04)" },
                          border: { display: false },
                        },
                      },
                    }}
                  />
                </div>
              </CardModern>
              <CardModern title="Task breakdown" note="All projects">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div className="pie-chart-container">
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
                              colors.amber,
                              colors.blue,
                              colors.mint,
                            ],
                            borderWidth: 0,
                            hoverOffset: 4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: "74%",
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: true },
                        },
                      }}
                    />
                    <div className="pie-chart-center">
                      <div className="pie-chart-value">
                        {taskBreakdown.total}
                      </div>
                      <div className="pie-chart-label">total tasks</div>
                    </div>
                  </div>
                  <div className="task-breakdown-legend">
                    <div className="legend-item">
                      <div
                        className="legend-color"
                        style={{ background: colors.amber }}
                      />
                      Todo {taskBreakdown.todoPct}%
                    </div>
                    <div className="legend-item">
                      <div
                        className="legend-color"
                        style={{ background: colors.blue }}
                      />
                      In progress {taskBreakdown.inProgressPct}%
                    </div>
                    <div className="legend-item">
                      <div
                        className="legend-color"
                        style={{ background: colors.mint }}
                      />
                      Done {taskBreakdown.completedPct}%
                    </div>
                  </div>
                </div>
              </CardModern>
            </div>
          )}

          {/* Projects */}
          <CardModern
            title="My project access"
            pill={`${filteredProjects.length} shown`}
          >
            {filteredProjects.length === 0 ? (
              <div className="no-projects">
                <p className="no-projects-text">
                  No {projectSlide} projects found.
                </p>
                <button
                  onClick={scrollToCreateProject}
                  className="no-projects-btn"
                >
                  Create your first project →
                </button>
              </div>
            ) : (
              <div className="projects-grid">
                {filteredProjects.map((p, i) => {
                  const pct =
                    p.task_count > 0
                      ? Math.round(
                          (p.completed_task_count / p.task_count) * 100,
                        )
                      : 0;
                  const badgeClass =
                    p.status === "active"
                      ? "project-badge active"
                      : p.status === "hold"
                        ? "project-badge hold"
                        : "project-badge done";
                  const badgeText =
                    p.status === "active"
                      ? "Active"
                      : p.status === "hold"
                        ? "On hold"
                        : "Done";
                  const colors2 = [
                    colors.cyan,
                    colors.violet,
                    colors.mint,
                    colors.amber,
                    colors.rose,
                    colors.blue,
                  ];
                  const pc = colors2[i % colors2.length];
                  return (
                    <div
                      key={p.id}
                      className="project-card"
                      onClick={() => router.push(`/project/${p.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="project-card-header">
                        <div className="project-card-title">{p.title}</div>
                        <span className={badgeClass}>{badgeText}</span>
                      </div>
                      <div className="project-desc">
                        {p.description || "No description"}
                      </div>
                      {p.task_count > 0 && (
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${pct}%`,
                              background: pc,
                            }}
                          />
                        </div>
                      )}
                      <div className="project-footer">
                        <div className="project-members">
                          {Array.from({
                            length: Math.min(3, p.members?.length || 0),
                          }).map((_, j) => (
                            <div
                              key={j}
                              className="member-avatar"
                              style={{
                                background: `${pc}1a`,
                                color: pc,
                              }}
                            >
                              {p.members?.[j]?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "?"}
                            </div>
                          ))}
                        </div>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardModern>

          {/* Tasks + Activity + Quick Actions */}
          <div className="three-col-grid">
            {/* Tasks */}
            <CardModern title="My tasks" note="Due this week">
              <div className="tasks-list">
                {activity.slice(0, 5).map((a, i) => (
                  <div key={i} className="task-item">
                    <div className="task-checkbox" />
                    <div className="task-text">{a.action?.slice(0, 50)}</div>
                    <span className="task-tag">Dev</span>
                  </div>
                ))}
              </div>
            </CardModern>

            {/* Activity */}
            <CardModern title="Team activity" note="Live">
              <div className="activity-list">
                {activity.slice(0, 4).map((a, i) => {
                  const initials =
                    a.user_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "?";
                  const acs = [
                    colors.cyan,
                    colors.violet,
                    colors.mint,
                    colors.amber,
                  ];
                  return (
                    <div key={i} className="activity-item">
                      <div
                        className="activity-avatar"
                        style={{
                          background: `${acs[i % acs.length]}1a`,
                          color: acs[i % acs.length],
                        }}
                      >
                        {initials}
                      </div>
                      <div className="activity-content">
                        <div className="activity-action">
                          {a.action?.slice(0, 60)}
                        </div>
                        <div className="activity-meta">
                          {a.user_name} · 2h ago
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardModern>

            {/* Quick Actions */}
            <CardModern title="Quick actions">
              <div className="quick-actions-grid">
                {[
                  { icon: "➕", l: "New project", s: "Start from scratch" },
                  { icon: "✓", l: "New task", s: "Add to any project" },
                  { icon: "📤", l: "Upload file", s: "Share with team" },
                  { icon: "👥", l: "Invite member", s: "Grow your team" },
                ].map((q, i) => (
                  <div key={i} className="quick-action-btn">
                    <div className="quick-action-emoji">{q.icon}</div>
                    <div className="quick-action-title">{q.l}</div>
                    <div className="quick-action-desc">{q.s}</div>
                  </div>
                ))}
              </div>
              <div className="weekly-goal">
                <div className="weekly-goal-title">🎯 Weekly goal</div>
                <div className="weekly-goal-desc">
                  Close 5 tasks in API Revamp
                </div>
                <div className="weekly-goal-progress">
                  <div className="weekly-goal-fill" style={{ width: "60%" }} />
                </div>
                <div className="weekly-goal-stat">3 of 5 completed · 60%</div>
              </div>
            </CardModern>
          </div>

          {/* Create Project */}
          <CardModern title="Create New Project" ref={createProjectRef}>
            <form onSubmit={createProject} className="create-project-form">
              <input
                type="text"
                placeholder="Project title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="form-input"
              />
              <textarea
                placeholder="Project description (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="form-textarea"
              />
              <button type="submit" className="form-submit-btn">
                Create Project
              </button>
            </form>
          </CardModern>
        </main>
      </div>
    </>
  );
}
