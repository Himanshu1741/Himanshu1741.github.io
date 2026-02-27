import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Navbar from "../../../components/layout/Navbar";
import API from "../../../services/api";

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
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [projectRes, taskRes, milestoneRes] = await Promise.all([
          API.get(`/projects/${id}/detail`),
          API.get(`/tasks/${id}`),
          API.get(`/milestones/${id}`),
        ]);

        setProject(projectRes.data || null);

        const taskEvents = taskRes.data
          .filter((t) => t.due_date)
          .map((t) => ({
            id: `task-${t.id}`,
            title: `📋 ${t.title}`,
            start: new Date(t.due_date),
            end: new Date(t.due_date),
            allDay: true,
            resource: { type: "task", priority: t.priority, status: t.status },
          }));

        const milestoneEvents = milestoneRes.data
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
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const eventStyleGetter = (event) => {
    const { type, priority, status } = event.resource || {};
    let bg = "#3b82f6";

    if (type === "milestone") {
      bg = status === "completed" ? "#10b981" : "#8b5cf6";
    } else if (type === "task") {
      if (status === "completed") {
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
            <div className="hero-tag">Calendar View</div>
            <h1 className="hero-headline">
              Project
              <br />
              <em>Timeline</em>
            </h1>
            <p className="hero-sub">
              See all task due dates and milestones on a calendar.
            </p>
          </div>
          <div className="mt-6 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-red-500" />{" "}
              High priority task
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />{" "}
              Medium priority task
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-green-500" />{" "}
              Completed / Low priority
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-violet-500" />{" "}
              Milestone
            </div>
          </div>
        </section>

        <section className="right dashboard-right">
          <div className="dashboard-content">
            <Navbar
              title={
                project?.title
                  ? `${project.title} – Calendar`
                  : "Project Calendar"
              }
              showDashboard
              onLogout={logout}
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                className="btn-secondary text-sm"
                onClick={() => router.push(`/project/${id}`)}
              >
                ← Back to Project
              </button>
            </div>

            {loading ? (
              <div className="panel-card p-8 text-center text-slate-400">
                Loading calendar…
              </div>
            ) : (
              <div className="panel-card overflow-hidden p-4">
                <style>{`
                  .rbc-calendar { background: transparent; color: #e2e8f0; }
                  .rbc-toolbar { margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
                  .rbc-toolbar button { background: rgba(30,41,59,0.8); color: #cbd5e1; border: 1px solid #334155; border-radius: 8px; padding: 4px 12px; }
                  .rbc-toolbar button:hover, .rbc-toolbar button.rbc-active { background: rgba(56,189,248,0.15); color: #38bdf8; border-color: #38bdf8; }
                  .rbc-toolbar-label { color: #f1f5f9; font-weight: 600; }
                  .rbc-header { background: rgba(15,23,42,0.6); color: #94a3b8; border-color: #1e293b; padding: 6px; }
                  .rbc-month-view, .rbc-time-view { border-color: #1e293b; }
                  .rbc-day-bg, .rbc-off-range-bg { background: rgba(15,23,42,0.3); }
                  .rbc-today { background: rgba(56,189,248,0.08) !important; }
                  .rbc-date-cell { color: #94a3b8; }
                  .rbc-date-cell.rbc-now { color: #38bdf8; font-weight: 700; }
                  .rbc-row-segment { padding: 1px 4px; }
                  .rbc-event-label { display: none; }
                `}</style>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  eventPropGetter={eventStyleGetter}
                  views={["month", "week", "agenda"]}
                  defaultView="month"
                  popup
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
