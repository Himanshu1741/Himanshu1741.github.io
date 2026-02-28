// DEADLINE TRACKER PAGE
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import AppLayout from "../components/layout/AppLayout";
import API from "../services/api";

// Load calendar only on client side (avoids SSR issues with react-big-calendar)
const DeadlineCalendar = dynamic(
  () => import("../components/project/DeadlineCalendar"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[560px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
    ),
  },
);

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / 86400000);
}

function urgencyLabel(days) {
  if (days === null)
    return {
      text: "No due date",
      cls: "text-slate-400 bg-slate-100 dark:bg-slate-800",
    };
  if (days < 0)
    return {
      text: `${Math.abs(days)}d overdue`,
      cls: "text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400",
    };
  if (days === 0)
    return {
      text: "Due today",
      cls: "text-orange-600 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400",
    };
  if (days <= 3)
    return {
      text: `${days}d left`,
      cls: "text-yellow-700 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-300",
    };
  if (days <= 7)
    return {
      text: `${days}d left`,
      cls: "text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400",
    };
  return {
    text: `${days}d left`,
    cls: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400",
  };
}

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

/* ─── Toast ─────────────────────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return { toasts, add };
}
function ToastContainer({ toasts }) {
  const c = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
  };
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${c[t.type] || c.info}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── Task Detail Slide-over ─────────────────────────────────────────────────── */
function TaskDetail({ task, onClose }) {
  if (!task) return null;
  const days = daysUntil(task.due_date);
  const u = urgencyLabel(days);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative h-full w-full max-w-sm overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl"
        >
          ✕
        </button>
        <div className="space-y-4 mt-6">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${u.cls}`}
          >
            {u.text}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {task.description}
            </p>
          )}
          <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Project</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {task.project_title}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="font-semibold capitalize">{task.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Priority</span>
              <span className="font-semibold capitalize">
                {task.priority || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Due date</span>
              <span className="font-semibold">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────────── */
function StatCard({ label, value, color }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border py-4 px-3 ${color}`}
    >
      <span className="text-2xl font-extrabold">{value}</span>
      <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wide opacity-70">
        {label}
      </span>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function DeadlinesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "calendar"
  const [filter, setFilter] = useState("all"); // all | overdue | today | week | upcoming
  const [projectFilter, setProjectFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const { toasts, add: toast } = useToast();

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

  const loadDeadlines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/tasks/deadlines");
      setTasks(res.data || []);
    } catch {
      toast("Failed to load deadlines", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadDeadlines();
  }, [user]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Unique projects for filter dropdown
  const projects = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!map[t.project_id]) map[t.project_id] = t.project_title;
    });
    return Object.entries(map).map(([id, title]) => ({ id, title }));
  }, [tasks]);

  // Enrich tasks with daysLeft, overdue flag
  const enriched = useMemo(
    () =>
      tasks.map((t) => {
        const days = daysUntil(t.due_date);
        return { ...t, daysLeft: days, overdue: days !== null && days < 0 };
      }),
    [tasks],
  );

  // Apply urgency + project filter
  const filtered = useMemo(() => {
    let list = enriched;
    if (projectFilter !== "all")
      list = list.filter((t) => String(t.project_id) === projectFilter);
    switch (filter) {
      case "overdue":
        list = list.filter((t) => t.overdue);
        break;
      case "today":
        list = list.filter((t) => t.daysLeft === 0);
        break;
      case "week":
        list = list.filter(
          (t) => t.daysLeft !== null && t.daysLeft >= 0 && t.daysLeft <= 7,
        );
        break;
      case "upcoming":
        list = list.filter((t) => t.daysLeft !== null && t.daysLeft > 7);
        break;
    }
    // Sort: overdue first, then by due_date asc, then by priority
    return list.sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (a.due_date < b.due_date) return -1;
      if (a.due_date > b.due_date) return 1;
      return (
        (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
      );
    });
  }, [enriched, filter, projectFilter]);

  // Summary stats
  const stats = useMemo(
    () => ({
      overdue: enriched.filter((t) => t.overdue).length,
      today: enriched.filter((t) => t.daysLeft === 0).length,
      week: enriched.filter(
        (t) => t.daysLeft !== null && t.daysLeft >= 0 && t.daysLeft <= 7,
      ).length,
      total: enriched.length,
    }),
    [enriched],
  );

  // Calendar events
  const calEvents = useMemo(
    () =>
      enriched.map((t) => ({
        id: t.id,
        title: `${t.title} [${t.project_title}]`,
        start: new Date(t.due_date),
        end: new Date(t.due_date),
        resource: { overdue: t.overdue, daysLeft: t.daysLeft },
        allDay: true,
        _task: t,
      })),
    [enriched],
  );

  const STATUS_FILTERS = [
    { k: "all", label: "All" },
    { k: "overdue", label: "Overdue" },
    { k: "today", label: "Today" },
    { k: "week", label: "This Week" },
    { k: "upcoming", label: "Upcoming" },
  ];

  if (!user) return null;

  return (
    <>
      <ToastContainer toasts={toasts} />
      <TaskDetail task={selected} onClose={() => setSelected(null)} />

      <AppLayout user={user} activeTab="deadlines" onLogout={logout}>
        <div className="space-y-5">
          {/* ── Header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-500">
                  Workspace
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Deadline Tracker
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {stats.total} tasks with deadlines &middot; {stats.overdue}{" "}
                  overdue
                </p>
              </div>
              {/* View toggle */}
              <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                {["list", "calendar"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 text-xs font-semibold capitalize transition ${
                      view === v
                        ? "bg-amber-500 text-white"
                        : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    {v === "list" ? "📋 List" : "📅 Calendar"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total"
              value={stats.total}
              color="border-slate-200 text-slate-700 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <StatCard
              label="Overdue"
              value={stats.overdue}
              color={`border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 ${stats.overdue > 0 ? "ring-2 ring-red-400/30" : ""}`}
            />
            <StatCard
              label="Due Today"
              value={stats.today}
              color="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
            />
            <StatCard
              label="This Week"
              value={stats.week}
              color="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
            />
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  filter === k
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
            {/* Project filter */}
            {projects.length > 1 && (
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── CALENDAR VIEW ── */}
          {view === "calendar" && (
            <DeadlineCalendar
              events={calEvents}
              onSelectEvent={(ev) => setSelected(ev._task)}
            />
          )}

          {/* ── LIST VIEW ── */}
          {view === "list" && (
            <>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-14 dark:border-slate-800">
                  <span className="text-3xl">🎉</span>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {filter === "all"
                      ? "No tasks with deadlines yet"
                      : `No ${filter} tasks`}
                  </p>
                  {filter !== "all" && (
                    <button
                      onClick={() => setFilter("all")}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Show all
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((task) => {
                    const u = urgencyLabel(task.daysLeft);
                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelected(task)}
                        className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-amber-500/40"
                      >
                        {/* Urgency dot */}
                        <div
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            task.overdue
                              ? "bg-red-500 animate-pulse"
                              : task.daysLeft === 0
                                ? "bg-orange-500"
                                : task.daysLeft <= 3
                                  ? "bg-yellow-400"
                                  : task.daysLeft <= 7
                                    ? "bg-blue-500"
                                    : "bg-emerald-500"
                          }`}
                        />

                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {task.project_title}
                          </p>
                        </div>

                        {/* Priority badge */}
                        {task.priority && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              task.priority === "critical"
                                ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                : task.priority === "high"
                                  ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                                  : task.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}

                        {/* Status */}
                        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          {task.status}
                        </span>

                        {/* Due badge */}
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${u.cls}`}
                        >
                          {u.text}
                        </span>

                        {/* Due date */}
                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-600 hidden sm:block">
                          {new Date(task.due_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </>
  );
}
