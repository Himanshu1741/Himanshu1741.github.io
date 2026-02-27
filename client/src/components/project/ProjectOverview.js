import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";

// ─── SVG progress ring ────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 108, stroke = 11 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (pct / 100);
  const cx = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="rgba(51,65,85,0.5)"
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="url(#overview-ring-grad)"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ - filled}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <defs>
        <linearGradient
          id="overview-ring-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function Avatar({ name, index }) {
  const COLORS = [
    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    "bg-violet-500/20 text-violet-300 border-violet-500/30",
    "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "bg-rose-500/20 text-rose-300 border-rose-500/30",
    "bg-sky-500/20 text-sky-300 border-sky-500/30",
    "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  ];
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${COLORS[index % COLORS.length]}`}
    >
      {initials}
    </span>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, color }) {
  return (
    <div className="surface-soft flex flex-col items-center gap-0.5 rounded-2xl px-4 py-3 text-center">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-[11px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProjectOverview({ projectId, project }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [taskRes, memberRes, msRes] = await Promise.all([
        API.get(`/tasks/${projectId}`),
        API.get(`/projects/${projectId}/member-list`),
        API.get(`/milestones/${projectId}`),
      ]);
      setTasks(taskRes.data || []);
      setMembers(memberRes.data || []);
      setMilestones(msRes.data || []);
    } catch {
      // tolerate partial failures
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProg = tasks.filter((t) => t.status === "in_progress").length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const now = new Date();

  const overdueTasks = tasks.filter(
    (t) => t.due_date && t.status !== "completed" && new Date(t.due_date) < now,
  );

  const upcoming = [
    ...tasks
      .filter(
        (t) =>
          t.due_date && t.status !== "completed" && new Date(t.due_date) >= now,
      )
      .map((t) => ({ ...t, _type: "task" })),
    ...milestones
      .filter(
        (m) =>
          m.due_date && m.status !== "completed" && new Date(m.due_date) >= now,
      )
      .map((m) => ({ ...m, _type: "milestone" })),
  ]
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="panel-card flex items-center justify-center gap-3 p-10 text-slate-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        Loading overview…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Overdue warning ─────────────────────────────────────────────── */}
      {overdueTasks.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              strokeLinecap="round"
            />
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
          </svg>
          <span>
            <strong>{overdueTasks.length}</strong> overdue task
            {overdueTasks.length > 1 ? "s" : ""} — open the <em>Tasks</em> tab
            to address them.
          </span>
        </div>
      )}

      {/* ── Top: progress ring + stat chips ─────────────────────────────── */}
      <div className="panel-card p-5">
        <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">
          Progress
        </p>
        <div className="flex flex-wrap items-center gap-6">
          {/* Ring */}
          <div className="relative flex items-center justify-center">
            <ProgressRing pct={pct} />
            <span className="absolute text-xl font-bold text-white">
              {pct}%
            </span>
          </div>
          {/* Chips */}
          <div className="flex flex-1 flex-wrap gap-3">
            <StatChip label="Total" value={total} color="text-slate-200" />
            <StatChip label="To Do" value={todo} color="text-amber-300" />
            <StatChip label="In Progress" value={inProg} color="text-sky-300" />
            <StatChip
              label="Completed"
              value={completed}
              color="text-emerald-300"
            />
          </div>
        </div>

        {/* Bar breakdown */}
        {total > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            {[
              {
                label: "To Do",
                count: todo,
                bar: "bg-amber-400",
                text: "text-amber-300",
              },
              {
                label: "In Progress",
                count: inProg,
                bar: "bg-sky-400",
                text: "text-sky-300",
              },
              {
                label: "Completed",
                count: completed,
                bar: "bg-emerald-400",
                text: "text-emerald-300",
              },
            ].map(({ label, count, bar, text }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`w-24 shrink-0 text-xs font-semibold ${text}`}>
                  {label}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-800 h-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${bar}`}
                    style={{ width: `${Math.round((count / total) * 100)}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-slate-400">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Middle row: Members + Milestones ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Members */}
        <div className="panel-card p-5">
          <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">
            Team · {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
          {members.length === 0 ? (
            <p className="text-xs text-slate-500">No members yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {members.map((m, i) => (
                <div
                  key={m.user_id ?? m.id}
                  className="flex items-center gap-3"
                >
                  <Avatar name={m.name} index={i} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {m.name}
                    </p>
                    {m.email && (
                      <p className="truncate text-[11px] text-slate-500">
                        {m.email}
                      </p>
                    )}
                  </div>
                  {m.member_role && (
                    <span className="ml-auto shrink-0 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] capitalize text-slate-400">
                      {m.member_role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="panel-card p-5">
          <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">
            Milestones · {milestones.length}
          </p>
          {milestones.length === 0 ? (
            <p className="text-xs text-slate-500">
              No milestones yet. Create them in the Milestones tab.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {milestones.map((ms) => {
                const isDone = ms.status === "completed";
                return (
                  <div key={ms.id} className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${isDone ? "bg-emerald-400" : "bg-violet-400"}`}
                    />
                    <span className="flex-1 truncate text-sm text-slate-200">
                      {ms.title}
                    </span>
                    {ms.due_date && (
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {ms.due_date}
                      </span>
                    )}
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold
                        ${isDone ? "bg-emerald-500/15 text-emerald-300" : "bg-violet-500/15 text-violet-300"}`}
                    >
                      {isDone ? "Done" : "Open"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming due dates ───────────────────────────────────────────── */}
      <div className="panel-card p-5">
        <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">
          Upcoming Due Dates
        </p>
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-500">
            No upcoming items with due dates.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {upcoming.map((item) => {
              const daysLeft = Math.ceil(
                (new Date(item.due_date) - now) / 86400000,
              );
              const isUrgent = daysLeft <= 2;
              return (
                <div
                  key={`${item._type}-${item.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5"
                >
                  <span className="text-base">
                    {item._type === "milestone" ? "🏁" : "📋"}
                  </span>
                  <span className="flex-1 truncate text-sm text-slate-200">
                    {item.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold
                      ${
                        isUrgent
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                  >
                    {daysLeft === 0
                      ? "Today"
                      : daysLeft === 1
                        ? "Tomorrow"
                        : `${daysLeft}d`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── About / description ───────────────────────────────────────────── */}
      {project?.description && (
        <div className="panel-card p-5">
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">
            About
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            {project.description}
          </p>
        </div>
      )}
    </div>
  );
}
