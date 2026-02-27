import { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Navbar from "../components/layout/Navbar";
import NewUserGuide from "../components/common/NewUserGuide";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

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

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [projectQuery, setProjectQuery] = useState("");
  const [projectSlide, setProjectSlide] = useState("active");
  const [pageError, setPageError] = useState("");
  const createProjectRef = useRef(null);
  const router = useRouter();

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
          "Failed to load summary",
      );
    }
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
        if (res.data.user?.role === "admin" && !isAdminPreviewMode) {
          router.push("/admin");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      });

    loadProjects();
    loadSummary();
  }, [router.isReady, router.query.preview]);

  const createProject = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Project title is required");
      return;
    }

    await API.post("/projects", form);
    setForm({ title: "", description: "" });
    await loadProjects();
    await loadSummary();
  };

  const filteredProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase();
    const searched = !query
      ? projects
      : projects.filter((project) =>
          `${project.title} ${project.description || ""}`
            .toLowerCase()
            .includes(query),
        );

    if (projectSlide === "completed") {
      return searched.filter((project) => project.status === "completed");
    }

    return searched.filter((project) => project.status !== "completed");
  }, [projects, projectQuery, projectSlide]);

  const pieOptions = { responsive: true, maintainAspectRatio: false };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };
  const taskCompletionBreakdown = useMemo(() => {
    const total = Number(summary?.totalTasks ?? 0);
    const todo = Number(summary?.totalTodoTasks ?? 0);
    const inProgress = Number(summary?.totalInProgressTasks ?? 0);
    const completed = Number(summary?.totalCompletedTasks ?? 0);

    if (total <= 0) {
      return {
        total: 0,
        todo,
        inProgress,
        completed,
        todoPct: 0,
        inProgressPct: 0,
        completedPct: 0,
      };
    }

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

  const scrollToCreateProject = () => {
    createProjectRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const findProject = (value) => {
    const key = String(value || "").trim();
    if (!key) return null;
    const lowerKey = key.toLowerCase();

    const exactId = projects.find((p) => String(p.id) === key);
    if (exactId) return exactId;

    const exactTitle = projects.find(
      (p) => String(p.title || "").toLowerCase() === lowerKey,
    );
    if (exactTitle) return exactTitle;

    return (
      projects.find((p) =>
        String(p.title || "")
          .toLowerCase()
          .includes(lowerKey),
      ) || null
    );
  };

  const executeGuideCommand = async (command) => {
    if (!command?.type) {
      return { message: "Unknown command." };
    }

    if (command.type === "help") {
      return {
        message:
          "Commands: help, list projects, create project <title> | <description>, open project <id|title>, open project settings <id|title>, delete project <id|title>, complete project <id|title>, activate project <id|title>, rename project <id|title> | <new title>, update project description <id|title> | <new description>, show active projects, show completed projects, search project <text>, clear search, go to create project, open settings, open dashboard, open admin, logout.",
      };
    }

    if (command.type === "list_projects") {
      if (!projects.length) {
        return {
          message:
            "No projects found. Create one with: create project Demo App | Initial setup",
        };
      }
      const top = projects
        .slice(0, 8)
        .map((p) => `${p.id}: ${p.title}`)
        .join(", ");
      return { message: `Projects (${projects.length}): ${top}` };
    }

    if (command.type === "create_project") {
      const title = String(command.title || "").trim();
      const description = String(command.description || "").trim();
      if (!title) {
        return {
          message:
            "Please provide a project title. Example: create project Demo App | Initial setup",
        };
      }

      try {
        await API.post("/projects", { title, description });
        await loadProjects();
        await loadSummary();
        return {
          message: `Project "${title}" created successfully.`,
          actions: [
            { label: "Go to Dashboard", type: "route", path: "/dashboard" },
          ],
        };
      } catch (error) {
        return {
          message:
            error?.response?.data?.message || "Failed to create project.",
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
      if (user?.role !== "admin") {
        return { message: "Admin access required for this command." };
      }
      router.push("/admin");
      return { message: "Opening admin control center..." };
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
      const value = String(command.query || "").trim();
      setProjectQuery(value);
      return {
        message: value
          ? `Searching projects for "${value}".`
          : "Search cleared.",
      };
    }

    if (command.type === "clear_search") {
      setProjectQuery("");
      return { message: "Project search cleared." };
    }

    if (command.type === "open_project") {
      const value = String(command.project || "").trim();
      if (!value) {
        return {
          message: "Provide a project id or title. Example: open project 12",
        };
      }

      const targetProject = findProject(value);
      if (targetProject) {
        router.push(`/project/${targetProject.id}`);
        return { message: `Opening project "${targetProject.title}"...` };
      }

      return { message: `No project found for "${value}".` };
    }

    if (command.type === "open_project_settings") {
      const value = String(command.project || "").trim();
      const targetProject = findProject(value);
      if (!targetProject) {
        return { message: `No project found for "${value}".` };
      }
      router.push(`/project/${targetProject.id}/settings`);
      return { message: `Opening settings for "${targetProject.title}"...` };
    }

    if (command.type === "delete_project") {
      const value = String(command.project || "").trim();
      if (!value) {
        return {
          message: "Provide a project id or title. Example: delete project 12",
        };
      }

      const targetProject = findProject(value);

      if (!targetProject) {
        return { message: `No project found for "${value}".` };
      }

      if (
        !user ||
        (user.id !== targetProject.created_by && user.role !== "admin")
      ) {
        return { message: "You don't have permission to delete this project." };
      }

      try {
        await API.delete(`/projects/${targetProject.id}`);
        await loadProjects();
        await loadSummary();
        return {
          message: `Project "${targetProject.title}" deleted successfully.`,
        };
      } catch (error) {
        return {
          message:
            error?.response?.data?.message || "Failed to delete project.",
        };
      }
    }

    if (command.type === "set_project_status") {
      const value = String(command.project || "").trim();
      const targetProject = findProject(value);
      if (!targetProject) {
        return { message: `No project found for "${value}".` };
      }
      try {
        await API.put(`/projects/${targetProject.id}/status`, {
          status: command.status,
        });
        await loadProjects();
        await loadSummary();
        return {
          message: `Project "${targetProject.title}" marked as ${command.status}.`,
        };
      } catch (error) {
        return {
          message:
            error?.response?.data?.message ||
            "Failed to update project status.",
        };
      }
    }

    if (command.type === "rename_project") {
      const targetProject = findProject(command.project);
      const nextTitle = String(command.title || "").trim();
      if (!targetProject)
        return { message: `No project found for "${command.project}".` };
      if (!nextTitle) return { message: "New title is required." };
      try {
        await API.put(`/projects/${targetProject.id}`, {
          title: nextTitle,
          description: targetProject.description || "",
        });
        await loadProjects();
        return { message: `Project renamed to "${nextTitle}".` };
      } catch (error) {
        return {
          message:
            error?.response?.data?.message || "Failed to rename project.",
        };
      }
    }

    if (command.type === "update_project_description") {
      const targetProject = findProject(command.project);
      const nextDescription = String(command.description || "").trim();
      if (!targetProject)
        return { message: `No project found for "${command.project}".` };
      try {
        await API.put(`/projects/${targetProject.id}`, {
          title: targetProject.title,
          description: nextDescription,
        });
        await loadProjects();
        return { message: `Description updated for "${targetProject.title}".` };
      } catch (error) {
        return {
          message:
            error?.response?.data?.message || "Failed to update description.",
        };
      }
    }

    if (command.type === "logout") {
      logout();
      return { message: "Logging out..." };
    }

    return { message: "Command not supported yet." };
  };

  return (
    <main className="login-shell">
      <div className="layout dashboard-layout">
        <section className="left dashboard-left">
          <div className="brand">
            <div className="brand-icon">S</div>
            <div className="brand-name">
              Student<span>Collab</span>Hub
            </div>
          </div>

          <div className="hero-text">
            <div className="hero-tag">Member workspace</div>
            <h1 className="hero-headline">
              Build with
              <br />
              your <em>team</em>
              <br />
              every day.
            </h1>
            <p className="hero-sub">
              Track progress, manage tasks, and collaborate in one place with
              your project members.
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-num">{summary?.totalProjects ?? 0}</div>
              <div className="stat-label">Total projects</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                {summary?.totalActiveProjects ?? 0}
              </div>
              <div className="stat-label">Active projects</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                {summary?.totalCompletedTasks ?? 0}
              </div>
              <div className="stat-label">Tasks completed</div>
            </div>
          </div>
        </section>

        <section className="right dashboard-right">
          <div className="dashboard-content">
            <Navbar title="Member Dashboard" showSettings onLogout={logout} />

            {pageError ? (
              <section className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {pageError}
              </section>
            ) : null}

            <NewUserGuide
              user={user}
              projects={projects}
              onCreateProject={scrollToCreateProject}
              onExecuteCommand={executeGuideCommand}
            />

            {summary ? (
              <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="glass-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Total Projects
                  </p>
                  <p className="mt-1 text-3xl font-bold text-cyan-300">
                    {summary.totalProjects}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Active My Projects
                  </p>
                  <p className="mt-1 text-3xl font-bold text-blue-300">
                    {summary.totalActiveProjects ?? 0}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Completed My Projects
                  </p>
                  <p className="mt-1 text-3xl font-bold text-emerald-300">
                    {summary.totalCompletedProjects ?? 0}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Tasks Completed
                  </p>
                  <p className="mt-1 text-3xl font-bold text-lime-300">
                    {summary.totalCompletedTasks}
                  </p>
                </div>
              </section>
            ) : null}

            {summary ? (
              <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="panel-card p-5">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Task Completion
                  </h3>
                  <div className="h-56">
                    <Pie
                      data={{
                        labels: ["Todo", "In Progress", "Completed"],
                        datasets: [
                          {
                            data: [
                              taskCompletionBreakdown.todo,
                              taskCompletionBreakdown.inProgress,
                              taskCompletionBreakdown.completed,
                            ],
                            backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e"],
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={pieOptions}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-200 sm:grid-cols-3">
                    <p className="rounded-lg bg-slate-900/60 px-3 py-2">
                      Todo: {taskCompletionBreakdown.todoPct}% (
                      {taskCompletionBreakdown.todo})
                    </p>
                    <p className="rounded-lg bg-slate-900/60 px-3 py-2">
                      In Progress: {taskCompletionBreakdown.inProgressPct}% (
                      {taskCompletionBreakdown.inProgress})
                    </p>
                    <p className="rounded-lg bg-slate-900/60 px-3 py-2">
                      Completed: {taskCompletionBreakdown.completedPct}% (
                      {taskCompletionBreakdown.completed})
                    </p>
                  </div>
                </div>

                <div className="panel-card p-5">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Project Activity
                  </h3>
                  <div className="h-56">
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
                            label: "My Data",
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
                          },
                        ],
                      }}
                      options={barOptions}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            <section ref={createProjectRef} className="panel-card mb-6 p-5">
              <h3 className="mb-3 text-lg font-semibold text-white">
                Create Project
              </h3>
              <form onSubmit={createProject} className="grid gap-3">
                <input
                  className="input-modern"
                  placeholder="Project title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <textarea
                  className="input-modern min-h-24"
                  placeholder="Project description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
                <button type="submit" className="btn-primary w-fit">
                  <span className="inline-flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Create Project
                  </span>
                </button>
              </form>
            </section>

            <section className="panel-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">
                  My Project Access
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 text-slate-200 transition hover:border-cyan-400/70 hover:text-white"
                    onClick={() => router.push("/trash")}
                    aria-label="Open project trash"
                    title="Project Trash"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18" strokeLinecap="round" />
                      <path d="M8 6V4h8v2" strokeLinecap="round" />
                      <path
                        d="M19 6l-1 14H6L5 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/70 p-1">
                    <button
                      className={`${projectSlide === "active" ? "btn-primary" : "btn-secondary"} px-3 py-1.5 text-xs`}
                      onClick={() => setProjectSlide("active")}
                    >
                      <span className="inline-flex items-center gap-1">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="currentColor"
                        >
                          <circle cx="12" cy="12" r="6" />
                        </svg>
                        Active
                      </span>
                    </button>
                    <button
                      className={`${projectSlide === "completed" ? "btn-primary" : "btn-secondary"} px-3 py-1.5 text-xs`}
                      onClick={() => setProjectSlide("completed")}
                    >
                      <span className="inline-flex items-center gap-1">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M5 12l4 4 10-10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Completed
                      </span>
                    </button>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                    {filteredProjects.length} shown
                  </span>
                </div>
              </div>
              <input
                className="input-modern mb-4"
                placeholder="Search projects by title or description"
                value={projectQuery}
                onChange={(e) => setProjectQuery(e.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <h4 className="text-lg font-semibold text-white">
                      {project.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-300">
                      {project.description || "No description"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-1 ${project.status === "completed" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}
                      >
                        {project.status === "completed"
                          ? "Completed"
                          : "Active"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="btn-primary"
                        onClick={() => router.push(`/project/${project.id}`)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M5 12h14M12 5l7 7-7 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Open Project
                        </span>
                      </button>

                      {user &&
                      (user.id === project.created_by ||
                        user.role === "admin") ? (
                        <button
                          className="btn-danger"
                          onClick={async () => {
                            await API.delete(`/projects/${project.id}`);
                            await loadProjects();
                            await loadSummary();
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M3 6h18" strokeLinecap="round" />
                              <path d="M8 6V4h8v2" strokeLinecap="round" />
                              <path
                                d="M19 6l-1 14H6L5 6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Delete
                          </span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
