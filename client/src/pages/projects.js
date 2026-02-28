// MY PROJECTS PAGE
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import AppLayout from "../components/layout/AppLayout";
import API from "../services/api";

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function timeAgo(date) {
  if (!date) return null;
  const d = Math.floor((Date.now() - new Date(date)) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const GRADS = [
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

/* ─── Toast ─────────────────────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }) {
  const colors = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${colors[t.type] || colors.info}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── Confirm Modal ─────────────────────────────────────────────────────────── */
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
        <p className="mb-6 text-sm text-slate-400">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Project Card ──────────────────────────────────────────────────────────── */
function ProjectCard({ project, index, onOpen, onDelete, isOwner }) {
  const grad = GRADS[index % GRADS.length];
  const isCompleted = project.status === "completed";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900/80">
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${grad}`} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Status badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              isCompleted
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"}`}
            />
            {isCompleted ? "Completed" : "Active"}
          </span>

          {project.github_repo && (
            <a
              href={project.github_repo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 no-underline transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.57v-2c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.68.82.56C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          )}
        </div>

        {/* Title & description */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onOpen(project.id)}
        >
          <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
            {project.title}
          </h3>
          {project.description ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {project.description}
            </p>
          ) : (
            <p className="text-xs italic text-slate-400 dark:text-slate-600">
              No description
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white ${grad}`}
            >
              {initials(project.title)}
            </div>
            {project.created_at && (
              <span className="text-[11px] text-slate-400 dark:text-slate-600">
                {timeAgo(project.created_at)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpen(project.id)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-cyan-400"
            >
              Open →
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(project)}
                className="rounded-lg border border-transparent p-1.5 text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
                title="Delete project"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────────────────────────── */
function EmptyState({ filter, onClear, onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 py-16 dark:border-slate-800">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
        📂
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {filter ? `No ${filter} projects found` : "No projects yet"}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
          {filter
            ? "Try changing the filter or search query"
            : "Create your first project to get started"}
        </p>
      </div>
      <div className="flex gap-2">
        {filter && (
          <button
            onClick={onClear}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Clear filter
          </button>
        )}
        <button
          onClick={onCreate}
          className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-600 transition"
        >
          + New Project
        </button>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | completed
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, project: null });
  const { toasts, add: toast } = useToast();

  /* auth */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) {
      router.push("/login");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      router.push("/login");
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  /* load projects */
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/projects");
      setProjects(res.data || []);
    } catch {
      toast("Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  /* filtered list */
  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter === "active")
      list = list.filter((p) => p.status !== "completed");
    if (statusFilter === "completed")
      list = list.filter((p) => p.status === "completed");
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter((p) =>
        `${p.title} ${p.description || ""}`.toLowerCase().includes(q),
      );
    return list;
  }, [projects, statusFilter, query]);

  const activeCount = useMemo(
    () => projects.filter((p) => p.status !== "completed").length,
    [projects],
  );
  const completedCount = useMemo(
    () => projects.filter((p) => p.status === "completed").length,
    [projects],
  );

  /* create project */
  const createProject = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Title is required", "warning");
      return;
    }
    setCreating(true);
    try {
      await API.post("/projects", form);
      setForm({ title: "", description: "" });
      setShowCreate(false);
      await loadProjects();
      toast("Project created!", "success");
    } catch (err) {
      toast(
        err?.response?.data?.message || "Failed to create project",
        "error",
      );
    } finally {
      setCreating(false);
    }
  };

  /* delete project */
  const handleDelete = (project) => setConfirm({ open: true, project });
  const confirmDelete = async () => {
    const { project } = confirm;
    setConfirm({ open: false, project: null });
    try {
      await API.delete(`/projects/${project.id}`);
      await loadProjects();
      toast(`"${project.title}" deleted`, "success");
    } catch (err) {
      toast(err?.response?.data?.message || "Delete failed", "error");
    }
  };

  if (!user) return null;

  return (
    <>
      <ToastContainer toasts={toasts} />
      <ConfirmModal
        open={confirm.open}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirm.project?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, project: null })}
      />

      <AppLayout user={user} activeTab="projects" onLogout={logout}>
        <div className="space-y-6">
          {/* ── Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-violet-500/8 blur-3xl" />
            <div className="pointer-events-none absolute right-40 -bottom-8 h-32 w-32 rounded-full bg-cyan-500/8 blur-3xl" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-violet-500">
                  Workspace
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  My Projects
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {projects.length} project{projects.length !== 1 ? "s" : ""}{" "}
                  &middot; {activeCount} active &middot; {completedCount}{" "}
                  completed
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-600 active:scale-95"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                New Project
              </button>
            </div>
          </div>

          {/* ── Create project modal ── */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                <h3 className="mb-4 text-base font-bold text-white">
                  Create New Project
                </h3>
                <form onSubmit={createProject} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                      Project Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="e.g. Student Portal App"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                      Description{" "}
                      <span className="text-slate-600">(optional)</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="What is this project about?"
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreate(false);
                        setForm({ title: "", description: "" });
                      }}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="rounded-xl bg-violet-500 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 transition"
                    >
                      {creating ? "Creating…" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Search & filter bar ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:placeholder-slate-600"
              />
            </div>

            {/* Status filter tabs */}
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold capitalize transition ${
                  statusFilter === f
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {f}{" "}
                {f === "all"
                  ? `(${projects.length})`
                  : f === "active"
                    ? `(${activeCount})`
                    : `(${completedCount})`}
              </button>
            ))}
          </div>

          {/* ── Project grid ── */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              filter={
                statusFilter !== "all"
                  ? statusFilter
                  : query
                    ? "matching"
                    : null
              }
              onClear={() => {
                setStatusFilter("all");
                setQuery("");
              }}
              onCreate={() => setShowCreate(true)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  onOpen={(id) => router.push(`/project/${id}`)}
                  onDelete={handleDelete}
                  isOwner={project.created_by === user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
