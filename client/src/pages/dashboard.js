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
  const c = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  };
  return (
    <div
      style={{
        position: "fixed",
        right: "20px",
        top: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "12px",
            border: `1px solid ${t.type === "success" ? "rgba(34, 197, 94, 0.4)" : t.type === "error" ? "rgba(255, 92, 124, 0.4)" : t.type === "warning" ? "rgba(246, 166, 35, 0.4)" : "rgba(0, 212, 255, 0.4)"}`,
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: "500",
            color:
              t.type === "success"
                ? "#22c55e"
                : t.type === "error"
                  ? "#ff5c7c"
                  : t.type === "warning"
                    ? "#f6a623"
                    : "#00d4ff",
            background:
              t.type === "success"
                ? "rgba(34, 197, 94, 0.1)"
                : t.type === "error"
                  ? "rgba(255, 92, 124, 0.1)"
                  : t.type === "warning"
                    ? "rgba(246, 166, 35, 0.1)"
                    : "rgba(0, 212, 255, 0.1)",
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "16px",
          border: `1px solid ${colors.bg2}`,
          background: colors.bg1,
          padding: "24px",
          boxShadow: "0 20px 25px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h3
          style={{
            marginBottom: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#eef0f8",
          }}
        >
          {title}
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "14px", color: "#8890aa" }}>
          {message}
        </p>
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
        >
          <button
            style={{
              borderRadius: "8px",
              border: `1px solid ${colors.bg2}`,
              background: colors.bg2,
              padding: "8px 16px",
              fontSize: "14px",
              color: "#8890aa",
              cursor: "pointer",
              transition: ".15s",
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{
              borderRadius: "8px",
              background: colors.rose,
              color: "#fff",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              transition: ".15s",
            }}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCardModern({ label, value, accent }) {
  return (
    <div
      style={{
        background: colors.bg1,
        border: `1px solid rgba(255,255,255,.07)`,
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        position: "relative",
        overflow: "hidden",
        transition: ".2s",
        cursor: "default",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-18px",
          right: "-18px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          opacity: 0.18,
          filter: "blur(18px)",
          background: accent,
        }}
      />
      <span
        style={{
          fontSize: "10px",
          fontWeight: "500",
          color: "#484f66",
          textTransform: "uppercase",
          letterSpacing: ".7px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "26px",
          fontWeight: "700",
          letterSpacing: "-1px",
          lineHeight: 1,
          color: accent,
        }}
      >
        {value ?? 0}
      </span>
    </div>
  );
}

const CardModern = React.forwardRef(({ title, note, pill, children }, ref) => (
  <div
    ref={ref}
    style={{
      background: colors.bg1,
      border: `1px solid rgba(255,255,255,.07)`,
      borderRadius: "12px",
      padding: "16px",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "14px",
        gap: "8px",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#8890aa",
          textTransform: "uppercase",
          letterSpacing: ".6px",
        }}
      >
        {title}
      </span>
      {pill && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: `rgba(0, 212, 255, 0.08)`,
            color: colors.cyan,
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "20px",
          }}
        >
          {pill}
        </span>
      )}
      {note && (
        <span style={{ fontSize: "10px", color: "#484f66" }}>{note}</span>
      )}
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
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { min-height: 100vh; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: ${colors.bg0}; color: #eef0f8; font-size: 14px; line-height: 1.5; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${colors.bg1}; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.13); border-radius: 4px; }
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px);} to{opacity:1;transform:translateX(0);} }
      `}</style>
      <ToastContainer toasts={toasts} />
      <ConfirmModal {...confirm} onCancel={closeConfirm} />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: colors.bg0,
        }}
      >
        {/* Top Navigation */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: colors.bg1,
            borderBottom: `1px solid rgba(255,255,255,.07)`,
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: `linear-gradient(135deg, ${colors.cyan}, ${colors.violet})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "700",
                color: "#000",
                flexShrink: 0,
              }}
            >
              P
            </div>
            <span
              style={{
                fontSize: "15px",
                fontWeight: "600",
                letterSpacing: "-.3px",
              }}
            >
              Projex
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: `rgba(0, 212, 255, 0.15)`,
                border: `1px solid rgba(0, 212, 255, 0.2)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "700",
                color: colors.cyan,
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
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
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "20px 24px",
            gap: "20px",
            overflowY: "auto",
          }}
        >
          {/* Welcome Banner */}
          <div
            style={{
              background: colors.bg1,
              border: `1px solid rgba(255,255,255,.07)`,
              borderRadius: "16px",
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  color: colors.cyan,
                  textTransform: "uppercase",
                  letterSpacing: ".8px",
                  marginBottom: "5px",
                }}
              >
                Member workspace
              </p>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: "600",
                  letterSpacing: "-.3px",
                  color: "#eef0f8",
                }}
              >
                Welcome back, {user.name}!
              </h3>
              <p
                style={{ fontSize: "12px", color: "#8890aa", marginTop: "3px" }}
              >
                Track progress, manage tasks, and collaborate in one place.
              </p>
            </div>
            <button
              onClick={scrollToCreateProject}
              style={{
                background: `rgba(0, 212, 255, 0.1)`,
                border: `1px solid rgba(0, 212, 255, 0.25)`,
                color: colors.cyan,
                fontSize: "12px",
                fontWeight: "600",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: ".15s",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = `rgba(0, 212, 255, 0.18)`)
              }
              onMouseLeave={(e) =>
                (e.target.style.background = `rgba(0, 212, 255, 0.1)`)
              }
            >
              + New project
            </button>
          </div>

          {pageError && (
            <div
              style={{
                background: "rgba(255, 92, 124, 0.1)",
                border: `1px solid rgba(255, 92, 124, 0.4)`,
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#ff5c7c",
              }}
            >
              {pageError}
            </div>
          )}

          {/* KPI Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
            }}
          >
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr",
                gap: "12px",
              }}
            >
              <CardModern title="Project activity" note="Last 6 months">
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "175px",
                  }}
                >
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
                  <div
                    style={{
                      position: "relative",
                      width: "155px",
                      height: "155px",
                    }}
                  >
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
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "22px",
                          fontWeight: "700",
                          letterSpacing: "-.5px",
                          color: "#eef0f8",
                        }}
                      >
                        {taskBreakdown.total}
                      </div>
                      <div style={{ fontSize: "10px", color: "#8890aa" }}>
                        total tasks
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "14px",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "#8890aa",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          background: colors.amber,
                          flexShrink: 0,
                        }}
                      />
                      Todo {taskBreakdown.todoPct}%
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "#8890aa",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          background: colors.blue,
                          flexShrink: 0,
                        }}
                      />
                      In progress {taskBreakdown.inProgressPct}%
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        color: "#8890aa",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          background: colors.mint,
                          flexShrink: 0,
                        }}
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
              <div
                style={{
                  borderRadius: "12px",
                  border: `2px dashed ${colors.bg2}`,
                  padding: "40px 20px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "12px", color: "#484f66" }}>
                  No {projectSlide} projects found.
                </p>
                <button
                  onClick={scrollToCreateProject}
                  style={{
                    marginTop: "12px",
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: colors.cyan,
                    cursor: "pointer",
                  }}
                >
                  Create your first project →
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                }}
              >
                {filteredProjects.map((p, i) => {
                  const pct =
                    p.task_count > 0
                      ? Math.round(
                          (p.completed_task_count / p.task_count) * 100,
                        )
                      : 0;
                  const badgeClass =
                    p.status === "active"
                      ? {
                          bg: `rgba(29, 233, 182, 0.12)`,
                          fg: colors.mint,
                          text: "Active",
                        }
                      : p.status === "hold"
                        ? {
                            bg: `rgba(246, 166, 35, 0.12)`,
                            fg: colors.amber,
                            text: "On hold",
                          }
                        : {
                            bg: `rgba(79, 158, 255, 0.12)`,
                            fg: colors.blue,
                            text: "Done",
                          };
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
                      style={{
                        background: colors.bg2,
                        border: `1px solid rgba(255,255,255,.07)`,
                        borderRadius: "12px",
                        padding: "14px",
                        transition: ".2s",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "8px",
                          marginBottom: "5px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#eef0f8",
                          }}
                        >
                          {p.title}
                        </div>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: ".4px",
                            padding: "2px 7px",
                            borderRadius: "20px",
                            flexShrink: 0,
                            background: badgeClass.bg,
                            color: badgeClass.fg,
                          }}
                        >
                          {badgeClass.text}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#484f66",
                          marginBottom: "10px",
                          lineHeight: 1.4,
                        }}
                      >
                        {p.description || "No description"}
                      </div>
                      {p.task_count > 0 && (
                        <>
                          <div
                            style={{
                              height: "3px",
                              background: colors.bg0,
                              borderRadius: "2px",
                              overflow: "hidden",
                              marginBottom: "8px",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "2px",
                                width: `${pct}%`,
                                background: pc,
                                transition: "width .4s",
                              }}
                            />
                          </div>
                        </>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "10px",
                          color: "#484f66",
                        }}
                      >
                        <div style={{ display: "flex", gap: "3px" }}>
                          {Array.from({
                            length: Math.min(3, p.members?.length || 0),
                          }).map((_, j) => (
                            <div
                              key={j}
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                background: `${pc}1a`,
                                color: pc,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "8px",
                                fontWeight: "700",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 280px",
              gap: "12px",
            }}
          >
            {/* Tasks */}
            <CardModern title="My tasks" note="Due this week">
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {activity.slice(0, 5).map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 11px",
                      background: colors.bg2,
                      border: `1px solid transparent`,
                      borderRadius: "9px",
                      transition: ".15s",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "15px",
                        height: "15px",
                        borderRadius: "4px",
                        border: `1.5px solid rgba(255,255,255,.13)`,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        fontSize: "12px",
                        color: "#eef0f8",
                        minWidth: 0,
                      }}
                    >
                      {a.action?.slice(0, 50)}
                    </div>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: "600",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        flexShrink: 0,
                        background: `rgba(0, 212, 255, 0.1)`,
                        color: colors.cyan,
                      }}
                    >
                      Dev
                    </span>
                  </div>
                ))}
              </div>
            </CardModern>

            {/* Activity */}
            <CardModern title="Team activity" note="Live">
              <div
                style={{ display: "flex", flexDirection: "column", gap: "7px" }}
              >
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
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "9px",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        transition: ".15s",
                        cursor: "default",
                      }}
                    >
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "9px",
                          fontWeight: "700",
                          flexShrink: 0,
                          background: `${acs[i % acs.length]}1a`,
                          color: acs[i % acs.length],
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#eef0f8",
                            lineHeight: 1.35,
                          }}
                        >
                          {a.action?.slice(0, 60)}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#484f66",
                            marginTop: "2px",
                          }}
                        >
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                {[
                  { icon: "➕", l: "New project", s: "Start from scratch" },
                  { icon: "✓", l: "New task", s: "Add to any project" },
                  { icon: "📤", l: "Upload file", s: "Share with team" },
                  { icon: "👥", l: "Invite member", s: "Grow your team" },
                ].map((q, i) => (
                  <div
                    key={i}
                    style={{
                      background: colors.bg2,
                      border: `1px solid rgba(255,255,255,.07)`,
                      borderRadius: "9px",
                      padding: "12px",
                      cursor: "pointer",
                      transition: ".2s",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "6px",
                        color: "#8890aa",
                        fontSize: "16px",
                      }}
                    >
                      {q.icon}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#eef0f8",
                      }}
                    >
                      {q.l}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#484f66",
                        marginTop: "1px",
                      }}
                    >
                      {q.s}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: `rgba(0, 212, 255, 0.04)`,
                  border: `1px solid rgba(0, 212, 255, 0.13)`,
                  borderRadius: "9px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: colors.cyan,
                    marginBottom: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  🎯 Weekly goal
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#8890aa",
                    marginBottom: "8px",
                    lineHeight: 1.4,
                  }}
                >
                  Close 5 tasks in API Revamp
                </div>
                <div
                  style={{
                    height: "4px",
                    background: colors.bg0,
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "60%",
                      background: `linear-gradient(90deg, ${colors.cyan}, ${colors.violet})`,
                      borderRadius: "2px",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#484f66",
                    marginTop: "5px",
                  }}
                >
                  3 of 5 completed · 60%
                </div>
              </div>
            </CardModern>
          </div>

          {/* Create Project */}
          <CardModern title="Create New Project" ref={createProjectRef}>
            <form
              onSubmit={createProject}
              style={{ display: "grid", gap: "12px", maxWidth: "500px" }}
            >
              <input
                type="text"
                placeholder="Project title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{
                  background: colors.bg2,
                  border: `1px solid rgba(255,255,255,.07)`,
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#eef0f8",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />
              <textarea
                placeholder="Project description (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                style={{
                  background: colors.bg2,
                  border: `1px solid rgba(255,255,255,.07)`,
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#eef0f8",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  minHeight: "100px",
                  resize: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  background: `linear-gradient(135deg, ${colors.cyan}, ${colors.blue})`,
                  color: "#000",
                  fontSize: "13px",
                  fontWeight: "600",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  width: "fit-content",
                  transition: ".15s",
                }}
              >
                Create Project
              </button>
            </form>
          </CardModern>
        </main>
      </div>
    </>
  );
}
