// PROJECT PAGE — dashboard-style UI
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import AppLayout from "../../components/layout/AppLayout";
import ChatBox from "../../components/project/ChatBox";
import TaskBoard from "../../components/project/TaskBoard";
import FileUpload from "../../components/project/FileUpload";
import ProjectCopilot from "../../components/project/ProjectCopilot";
import Milestones from "../../components/project/Milestones";
import Analytics from "../../components/project/Analytics";
import ProjectOverview from "../../components/project/ProjectOverview";
import API from "../../services/api";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function timeAgo(date) {
  if (!date) return null;
  const d = Math.floor((Date.now() - new Date(date)) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

const GRADS = [
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

/* ─── Avatar Stack ────────────────────────────────────────────────────────── */
function AvatarStack({ members = [] }) {
  const shown = members.slice(0, 5);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <div
          key={m.id || i}
          title={m.name || m.email}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white border-2 border-white dark:border-slate-950 ${GRADS[i % GRADS.length]}`}
          style={{
            marginLeft: i === 0 ? 0 : -6,
            zIndex: shown.length - i,
            position: "relative",
          }}
        >
          {initials(m.name || m.email || "?")}
        </div>
      ))}
      {extra > 0 && (
        <div
          title={`${extra} more`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 text-[8px] font-bold text-slate-500 dark:text-slate-400"
          style={{ marginLeft: -6, position: "relative", zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ── Progress Ring ──────────────────────────────────────────────────────── */
function ProgressRing({ pct = 0, size = 64, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gid = `pg-${size}`;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(139,92,246,0.12)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        style={{
          transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </svg>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function HeroSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-80 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="flex gap-2 pt-1">
            <div className="h-7 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Card ────────────────────────────────────────────────────────────── */
function KPICard({ label, value, sub, accentClass = "bg-cyan-500", icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
      <div
        className={`absolute right-0 top-0 h-16 w-16 rounded-full blur-2xl opacity-20 ${accentClass}`}
      />
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentClass}/15`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-extrabold leading-none text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {label}
          </p>
          {sub && (
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Permission Denied ───────────────────────────────────────────────────── */
function PermissionDenied({ msg }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-slate-400 dark:text-slate-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          {msg}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-600">
          Ask the project creator to grant access.
        </p>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    done: 0,
    inProgress: 0,
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [projectPermissions, setProjectPermissions] = useState({
    can_add_members: false,
    can_change_project_name: false,
    can_manage_tasks: false,
    can_manage_files: false,
    can_chat: false,
  });
  const [isCreator, setIsCreator] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const memberPanelRef = useRef(null);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  /* auth guard */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  /* close member popover on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (memberPanelRef.current && !memberPanelRef.current.contains(e.target))
        setShowMembers(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* load project data */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) return;
        const u = JSON.parse(stored);

        const [projectRes, permRes] = await Promise.all([
          API.get(`/projects/${id}/detail`),
          API.get(`/projects/${id}/permissions`),
        ]);

        const currentProject = projectRes.data;
        setProject(currentProject || null);
        setIsCreator(
          Boolean(currentProject && currentProject.created_by === u.id),
        );

        const perms = permRes.data?.permissions || {};
        setProjectPermissions({
          can_add_members: Boolean(perms.can_add_members),
          can_change_project_name: Boolean(perms.can_change_project_name),
          can_manage_tasks: Boolean(perms.can_manage_tasks),
          can_manage_files: Boolean(perms.can_manage_files),
          can_chat: Boolean(perms.can_chat),
        });

        /* optional enrichment — don't break page if endpoints missing */
        try {
          const membersRes = await API.get(`/projects/${id}/members`);
          setMembers(membersRes.data || []);
        } catch {
          /* ignore */
        }

        try {
          const tasksRes = await API.get(`/tasks?projectId=${id}`);
          const tasks = tasksRes.data || [];
          setTaskStats({
            total: tasks.length,
            done: tasks.filter(
              (t) => t.status === "done" || t.status === "completed",
            ).length,
            inProgress: tasks.filter(
              (t) => t.status === "in_progress" || t.status === "in-progress",
            ).length,
          });
        } catch {
          /* ignore */
        }
      } catch {
        setProject(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canOpenSettings =
    isCreator ||
    projectPermissions.can_add_members ||
    projectPermissions.can_change_project_name;
  const canSeeTaskBoard = isCreator || projectPermissions.can_manage_tasks;
  const canSeeFileCard = isCreator || projectPermissions.can_manage_files;
  const canSeeChatCard = isCreator || projectPermissions.can_chat;
  const completionPct = taskStats.total
    ? Math.round((taskStats.done / taskStats.total) * 100)
    : 0;

  const TABS = [
    {
      key: "overview",
      label: "Overview",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      key: "tasks",
      label: "Tasks",
      badge: taskStats.total > 0 ? taskStats.total : null,
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M9 11l3 3L22 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "milestones",
      label: "Milestones",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="4" y1="22" x2="4" y2="15" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "files",
      label: "Files",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline points="13 2 13 9 20 9" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "chat",
      label: "Chat",
      live: true,
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "analytics",
      label: "Analytics",
      icon: (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
          <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
          <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  if (!user || !id) return null;

  return (
    <AppLayout user={user} activeTab="dashboard" onLogout={logout}>
      <div className="space-y-5">
        {/* ─── Breadcrumb ─────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </button>
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3 text-slate-300 dark:text-slate-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="max-w-xs truncate font-medium text-slate-600 dark:text-slate-400">
            {loading ? "Loading…" : project?.title || `Project ${id}`}
          </span>
        </nav>

        {/* ─── Hero card ──────────────────────────────────────── */}
        {loading ? (
          <HeroSkeleton />
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-500/8 blur-3xl" />
            <div className="pointer-events-none absolute right-32 -bottom-10 h-36 w-36 rounded-full bg-blue-600/8 blur-3xl" />

            <div className="flex flex-wrap items-start justify-between gap-5">
              {/* Left column */}
              <div className="min-w-0 flex-1 space-y-3">
                {/* Badge row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                      project?.status === "completed"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${project?.status === "completed" ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"}`}
                    />
                    {project?.status === "completed" ? "Completed" : "Active"}
                  </span>

                  {project?.github_repo && (
                    <a
                      href={project.github_repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 no-underline transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.57v-2c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.68.82.56C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  )}

                  {project?.created_at && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-600">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line
                          x1="16"
                          y1="2"
                          x2="16"
                          y2="6"
                          strokeLinecap="round"
                        />
                        <line
                          x1="8"
                          y1="2"
                          x2="8"
                          y2="6"
                          strokeLinecap="round"
                        />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {timeAgo(project.created_at)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  {project?.title || `Project ${id}`}
                </h1>

                {project?.description && (
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-500">
                    {project.description}
                  </p>
                )}

                {/* Members row */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {members.length > 0 && (
                    <div className="relative" ref={memberPanelRef}>
                      <button
                        onClick={() => setShowMembers((v) => !v)}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
                      >
                        <AvatarStack members={members} />
                        <span>
                          {members.length} member
                          {members.length !== 1 ? "s" : ""}
                        </span>
                        <svg
                          viewBox="0 0 24 24"
                          className={`h-3 w-3 transition-transform ${showMembers ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {showMembers && (
                        <div className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/60">
                          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                              Team — {members.length} member
                              {members.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {members.map((m, i) => (
                            <div
                              key={m.id || i}
                              className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-900/80"
                            >
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white ${GRADS[i % GRADS.length]}`}
                              >
                                {initials(m.name || m.email || "?")}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                  {m.name || m.email}
                                </p>
                                <p className="text-[11px] capitalize text-slate-500 dark:text-slate-600">
                                  {m.role || "Member"}
                                </p>
                              </div>
                              {m.id === project?.created_by && (
                                <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
                                  Owner
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {taskStats.total > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 text-cyan-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M9 11l3 3L22 4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {taskStats.done}/{taskStats.total} tasks completed
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
                {taskStats.total > 0 && (
                  <div
                    className="relative flex items-center justify-center"
                    title={`${completionPct}% complete`}
                  >
                    <ProgressRing pct={completionPct} size={56} stroke={5} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-extrabold leading-none text-slate-900 dark:text-white">
                        {completionPct}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-slate-500 dark:text-slate-600">
                        done
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => router.push(`/project/${id}/calendar`)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line
                        x1="16"
                        y1="2"
                        x2="16"
                        y2="6"
                        strokeLinecap="round"
                      />
                      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Calendar
                  </button>

                  {isCreator && (
                    <button
                      onClick={() => router.push(`/trash?projectId=${id}`)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
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
                      Trash
                    </button>
                  )}

                  {canOpenSettings && (
                    <button
                      onClick={() => router.push(`/project/${id}/settings`)}
                      className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-400"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
                        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
                      </svg>
                      Settings
                    </button>
                  )}
                </div>
              </div>
            </div>

            {taskStats.total > 0 && (
              <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── KPI row ────────────────────────────────────────── */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPICard
              label="Total Tasks"
              value={taskStats.total}
              sub={
                taskStats.inProgress > 0
                  ? `${taskStats.inProgress} in progress`
                  : undefined
              }
              accentClass="bg-cyan-500"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M9 11l3 3L22 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
            <KPICard
              label="Completed"
              value={taskStats.done}
              sub={taskStats.total ? `${completionPct}% done` : undefined}
              accentClass="bg-emerald-500"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline
                    points="20 6 9 17 4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
            <KPICard
              label="Team Size"
              value={members.length}
              sub={
                members.length > 0
                  ? isCreator
                    ? "You are the owner"
                    : "You are a member"
                  : undefined
              }
              accentClass="bg-blue-500"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    strokeLinecap="round"
                  />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                </svg>
              }
            />
            <KPICard
              label="Progress"
              value={`${completionPct}%`}
              sub={
                completionPct === 100
                  ? "All done! 🎉"
                  : completionPct > 0
                    ? `${taskStats.total - taskStats.done} remaining`
                    : "Not started"
              }
              accentClass="bg-violet-500"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline
                    points="12 6 12 12 16 14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
          </div>
        )}

        {/* ─── AI Copilot ─────────────────────────────────────── */}
        <ProjectCopilot projectId={id} />

        {/* ─── Tab bar ────────────────────────────────────────── */}
        <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="inline-flex min-w-full gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/60">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                    : "text-slate-500 hover:bg-white/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge != null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      activeTab === tab.key
                        ? "bg-cyan-500/25 text-cyan-700 dark:text-cyan-300"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.live && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      activeTab === tab.key
                        ? "animate-pulse bg-cyan-500 dark:bg-cyan-400"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Tab content ────────────────────────────────────── */}
        <div key={activeTab} className="pb-10">
          {activeTab === "overview" && (
            <ProjectOverview projectId={id} project={project} />
          )}

          {activeTab === "tasks" &&
            (canSeeTaskBoard ? (
              <TaskBoard projectId={id} />
            ) : (
              <PermissionDenied msg="No task management permission" />
            ))}

          {activeTab === "milestones" && <Milestones projectId={id} />}

          {activeTab === "files" &&
            (canSeeFileCard ? (
              <FileUpload projectId={id} />
            ) : (
              <PermissionDenied msg="No file management permission" />
            ))}

          {activeTab === "chat" &&
            (canSeeChatCard ? (
              <ChatBox projectId={id} />
            ) : (
              <PermissionDenied msg="Chat permission denied" />
            ))}

          {activeTab === "analytics" && <Analytics projectId={id} />}
        </div>
      </div>
    </AppLayout>
  );
}
