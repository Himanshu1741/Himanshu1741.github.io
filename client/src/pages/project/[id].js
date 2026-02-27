import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ChatBox from "../../components/project/ChatBox";
import TaskBoard from "../../components/project/TaskBoard";
import FileUpload from "../../components/project/FileUpload";
import ProjectCopilot from "../../components/project/ProjectCopilot";
import Milestones from "../../components/project/Milestones";
import Analytics from "../../components/project/Analytics";
import ProjectOverview from "../../components/project/ProjectOverview";
import Navbar from "../../components/layout/Navbar";
import API from "../../services/api";

/* ── tiny helpers ── */
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function AvatarStack({ members = [] }) {
  const shown = members.slice(0, 5);
  const extra = members.length - shown.length;
  const colors = ["#8b5cf6", "#6366f1", "#22d3ee", "#10b981", "#f59e0b"];
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((m, i) => (
        <div
          key={m.id || i}
          title={m.name || m.email}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: colors[i % colors.length],
            border: "2px solid #050b18",
            marginLeft: i === 0 ? 0 : -8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "#fff",
            zIndex: shown.length - i,
            position: "relative",
          }}
        >
          {initials(m.name || m.email || "?")}
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(139,92,246,0.15)",
            border: "2px solid #8b5cf6",
            marginLeft: -8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "#a78bfa",
            zIndex: 0,
            position: "relative",
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

function ProgressRing({ pct = 0, size = 48, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(139,92,246,0.15)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#prog-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
      />
      <defs>
        <linearGradient id="prog-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [activeTab, setActiveTab] = useState("overview");
  const [projectPermissions, setProjectPermissions] = useState({
    can_add_members: false,
    can_change_project_name: false,
    can_manage_tasks: false,
    can_manage_files: false,
    can_chat: false,
  });
  const [isCreator, setIsCreator] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/login");
  }, [router]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);

        const [projectRes, permRes] = await Promise.all([
          API.get(`/projects/${id}/detail`),
          API.get(`/projects/${id}/permissions`),
        ]);

        const currentProject = projectRes.data;
        setProject(currentProject || null);
        setIsCreator(
          Boolean(currentProject && currentProject.created_by === user.id),
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
          });
        } catch {
          /* ignore */
        }
      } catch {
        setProject(null);
      }
    };
    load();
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
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      key: "tasks",
      label: "Tasks",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
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
          className="h-4 w-4"
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
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="13 2 13 9 20 9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "chat",
      label: "Chat",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
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
          className="h-4 w-4"
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

  if (!id) return null;

  return (
    <div className="workspace-shell">
      {/* Background */}
      <div className="workspace-bg-grid" aria-hidden />
      <div className="workspace-orb workspace-orb-1" aria-hidden />
      <div className="workspace-orb workspace-orb-2" aria-hidden />

      <div className="workspace-body">
        <Navbar
          title={project?.title || `Project ${id}`}
          showDashboard
          onLogout={logout}
        />

        {/* ══ PROJECT HERO ══════════════════════════════════════ */}
        <div className="project-hero mb-6">
          <div className="project-hero-inner">
            {/* Left: identity */}
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="project-status-badge">
                  <span className="project-status-dot" />
                  {project?.status === "completed" ? "Completed" : "Active"}
                </span>
                {project?.github_repo && (
                  <a
                    href={project.github_repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-status-badge"
                    style={{ textDecoration: "none" }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      style={{ width: 12, height: 12 }}
                      fill="currentColor"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.57v-2c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.68.82.56C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                )}
              </div>

              <h1 className="project-hero-title">
                {project?.title || `Project ${id}`}
              </h1>

              {project?.description && (
                <p className="project-hero-desc">{project.description}</p>
              )}

              {/* Members + meta row */}
              <div className="project-hero-meta">
                {members.length > 0 && (
                  <div className="project-hero-meta-item">
                    <AvatarStack members={members} />
                    <span>
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {taskStats.total > 0 && (
                  <div className="project-hero-meta-item">
                    <svg
                      viewBox="0 0 24 24"
                      style={{ width: 14, height: 14, color: "#a78bfa" }}
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
                    <span>
                      {taskStats.done}/{taskStats.total} tasks done
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: progress + actions */}
            <div className="flex shrink-0 flex-col items-end gap-3">
              {/* Completion ring */}
              {taskStats.total > 0 && (
                <div className="project-progress-wrap">
                  <ProgressRing pct={completionPct} size={52} stroke={4} />
                  <div className="project-progress-label">
                    <span className="project-progress-pct">
                      {completionPct}%
                    </span>
                    <span className="project-progress-sub">done</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="icon-action-btn"
                  onClick={() => router.push(`/project/${id}/calendar`)}
                  title="Calendar"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Calendar</span>
                </button>

                {isCreator && (
                  <button
                    className="icon-action-btn"
                    onClick={() => router.push(`/trash?projectId=${id}`)}
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
                    <span>Trash</span>
                  </button>
                )}

                {canOpenSettings && (
                  <button
                    className="ws-settings-btn flex items-center gap-2"
                    onClick={() => router.push(`/project/${id}/settings`)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
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

          {/* Progress bar strip */}
          {taskStats.total > 0 && (
            <div className="project-hero-progress-bar">
              <div
                className="project-hero-progress-fill"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          )}
        </div>

        {/* AI Copilot */}
        <ProjectCopilot projectId={id} />

        {/* ══ TAB BAR ══════════════════════════════════════════ */}
        <div className="tab-bar mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn${activeTab === tab.key ? " tab-btn-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.key === "tasks" && taskStats.total > 0 && (
                <span className="tab-count">{taskStats.total}</span>
              )}
              {tab.key === "chat" && (
                <span className="tab-live-dot" title="Live" />
              )}
            </button>
          ))}
        </div>

        {/* ══ TAB CONTENT ══════════════════════════════════════ */}
        <div className="tab-content-area">
          {activeTab === "overview" && (
            <ProjectOverview projectId={id} project={project} />
          )}

          {activeTab === "tasks" && canSeeTaskBoard && (
            <TaskBoard projectId={id} />
          )}
          {activeTab === "tasks" && !canSeeTaskBoard && (
            <PermissionDenied msg="No task management permission" />
          )}

          {activeTab === "milestones" && <Milestones projectId={id} />}

          {activeTab === "files" && canSeeFileCard && (
            <FileUpload projectId={id} />
          )}
          {activeTab === "files" && !canSeeFileCard && (
            <PermissionDenied msg="No file management permission" />
          )}

          {activeTab === "chat" && canSeeChatCard && <ChatBox projectId={id} />}
          {activeTab === "chat" && !canSeeChatCard && (
            <PermissionDenied msg="Chat permission denied" />
          )}

          {activeTab === "analytics" && <Analytics projectId={id} />}
        </div>
      </div>
    </div>
  );
}

function PermissionDenied({ msg }) {
  return (
    <div className="permission-denied-card">
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1.5"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-slate-300 font-medium">{msg}</p>
      <p className="text-sm text-slate-500 mt-1">
        Ask the project creator to grant you access.
      </p>
    </div>
  );
}
