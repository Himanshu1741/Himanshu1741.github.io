import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import AppLayout from "../../../components/layout/AppLayout";
import API from "../../../services/api";
import socket from "../../../services/socket";

const localizer = momentLocalizer(moment);

const PRIORITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export default function CalendarView() {
  const router = useRouter();
  const { id } = router.query;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [project, setProject] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const [projectRes, taskRes, milestoneRes] = await Promise.all([
          API.get(`/projects/${id}/detail`),
          API.get(`/tasks/${id}`),
          API.get(`/milestones/${id}`),
        ]);

        setProject(projectRes.data || null);

        const taskEvents = (taskRes.data || [])
          .filter((t) => t.due_date)
          .map((t) => ({
            id: `task-${t.id}`,
            title: `📋 ${t.title}`,
            start: new Date(t.due_date),
            end: new Date(t.due_date),
            allDay: true,
            resource: { type: "task", priority: t.priority, status: t.status },
          }));

        const milestoneEvents = (milestoneRes.data || [])
          .filter((m) => m.due_date)
          .map((m) => ({
            id: `milestone-${m.id}`,
            title: `🏁 ${m.title}`,
            start: new Date(m.due_date),
            end: new Date(m.due_date),
            allDay: true,
            resource: { type: "milestone", status: m.status },
          }));

        setEvents([...taskEvents, ...milestoneEvents]);
        setLastUpdated(new Date());
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  /* Initial load */
  useEffect(() => {
    if (!id) return;
    load(false);
  }, [id, load]);

  /* Socket – join project room, refresh on task/milestone events */
  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        socket.emit("registerUser", JSON.parse(stored).id);
      } catch {}
    }
    socket.emit("joinProject", id);

    const refresh = () => load(true);
    // Re-fetch whenever the server broadcasts task or milestone changes
    socket.on("taskUpdated", refresh);
    socket.on("taskCreated", refresh);
    socket.on("taskDeleted", refresh);
    socket.on("milestoneUpdated", refresh);
    socket.on("milestoneCreated", refresh);
    socket.on("milestoneDeleted", refresh);
    // Generic project-room update trigger used by some controllers
    socket.on("projectUpdated", refresh);

    return () => {
      socket.emit("leaveProject", id);
      socket.off("taskUpdated", refresh);
      socket.off("taskCreated", refresh);
      socket.off("taskDeleted", refresh);
      socket.off("milestoneUpdated", refresh);
      socket.off("milestoneCreated", refresh);
      socket.off("milestoneDeleted", refresh);
      socket.off("projectUpdated", refresh);
    };
  }, [id, load]);

  /* Window focus – silently refresh when user switches back to this tab */
  useEffect(() => {
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const eventStyleGetter = (event) => {
    const { type, priority, status } = event.resource || {};
    let bg = "#3b82f6";

    if (type === "milestone") {
      bg = status === "completed" ? "#10b981" : "#8b5cf6";
    } else if (type === "task") {
      if (status === "completed" || status === "done") {
        bg = "#10b981";
      } else {
        bg = PRIORITY_COLORS[priority] || "#3b82f6";
      }
    }

    return {
      style: {
        backgroundColor: bg,
        border: "none",
        borderRadius: "6px",
        color: "#fff",
        fontSize: "12px",
        padding: "1px 4px",
      },
    };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  /* ── Legend chip ─────────────────────────────────────────── */
  const Legend = ({ color, label }) => (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );

  return (
    <AppLayout onLogout={logout}>
      <div className="space-y-5 pb-10">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {project?.title ? `${project.title} — ` : ""}
              <span className="text-cyan-600 dark:text-cyan-400">
                Calendar View
              </span>
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Task due dates and milestones at a glance
              {lastUpdated && (
                <span className="ml-2 text-[11px] text-slate-400 dark:text-slate-600">
                  · updated {moment(lastUpdated).fromNow()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M23 4v6h-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 20v-6h6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>

            <button
              onClick={() => router.push(`/project/${id}`)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              ← Back to Project
            </button>
          </div>
        </div>

        {/* ── Legend ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <Legend color="#ef4444" label="High priority" />
          <Legend color="#f59e0b" label="Medium priority" />
          <Legend color="#10b981" label="Completed / Low priority" />
          <Legend color="#8b5cf6" label="Milestone" />
          <Legend color="#3b82f6" label="Task (no priority)" />
        </div>

        {/* ── Calendar ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60">
            <svg
              className="mr-2 h-5 w-5 animate-spin text-cyan-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Loading calendar…
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            {refreshing && (
              <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-500" />
              </div>
            )}
            <style>{`
              .rbc-calendar { background: transparent; color: #e2e8f0; }
              .rbc-toolbar { margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
              .rbc-toolbar button { background: rgba(30,41,59,0.8); color: #cbd5e1; border: 1px solid #334155; border-radius: 8px; padding: 4px 12px; cursor: pointer; }
              .rbc-toolbar button:hover, .rbc-toolbar button.rbc-active { background: rgba(56,189,248,0.15); color: #38bdf8; border-color: #38bdf8; }
              .rbc-toolbar-label { color: #f1f5f9; font-weight: 600; }
              .rbc-header { background: rgba(15,23,42,0.6); color: #94a3b8; border-color: #1e293b; padding: 6px; }
              .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: #1e293b; }
              .rbc-day-bg, .rbc-off-range-bg { background: rgba(15,23,42,0.3); }
              .rbc-today { background: rgba(56,189,248,0.08) !important; }
              .rbc-date-cell { color: #94a3b8; }
              .rbc-date-cell.rbc-now { color: #38bdf8; font-weight: 700; }
              .rbc-row-segment { padding: 1px 4px; }
              .rbc-event-label { display: none; }
              .rbc-agenda-table { color: #cbd5e1; }
              .rbc-agenda-date-cell, .rbc-agenda-time-cell { color: #94a3b8; border-color: #1e293b; }
              .rbc-agenda-event-cell { border-color: #1e293b; }
            `}</style>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 620 }}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "agenda"]}
              defaultView="month"
              popup
            />
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────── */}
        {!loading && events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No tasks or milestones with due dates found.
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
              Add due dates to tasks or milestones to see them here.
            </p>
            <button
              onClick={() => router.push(`/project/${id}`)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-400"
            >
              Go to Project
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
