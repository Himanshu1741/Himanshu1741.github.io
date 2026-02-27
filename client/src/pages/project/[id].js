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

export default function ProjectPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState(null);
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
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const loadProjectAndPermissions = async () => {
      if (!id) return;
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        const user = JSON.parse(storedUser);
        // Use dedicated single-project endpoint for always-fresh data
        const projectRes = await API.get(`/projects/${id}/detail`);
        const currentProject = projectRes.data;
        setProject(currentProject || null);

        const creator = Boolean(
          currentProject && currentProject.created_by === user.id,
        );
        setIsCreator(creator);

        const permRes = await API.get(`/projects/${id}/permissions`);
        const perms = permRes.data?.permissions || {};
        setProjectPermissions({
          can_add_members: Boolean(perms.can_add_members),
          can_change_project_name: Boolean(perms.can_change_project_name),
          can_manage_tasks: Boolean(perms.can_manage_tasks),
          can_manage_files: Boolean(perms.can_manage_files),
          can_chat: Boolean(perms.can_chat),
        });
      } catch {
        setProject(null);
      }
    };

    loadProjectAndPermissions();
  }, [id]);

  const canOpenSettings =
    isCreator ||
    projectPermissions.can_add_members ||
    projectPermissions.can_change_project_name;
  const canSeeTaskBoard = isCreator || projectPermissions.can_manage_tasks;
  const canSeeFileCard = isCreator || projectPermissions.can_manage_files;
  const canSeeChatCard = isCreator || projectPermissions.can_chat;

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
      {/* Animated background */}
      <div className="workspace-bg-grid" aria-hidden />
      <div className="workspace-orb workspace-orb-1" aria-hidden />
      <div className="workspace-orb workspace-orb-2" aria-hidden />

      <div className="workspace-body">
        {/* Top navbar */}
        <Navbar
          title={project?.title || `Project ${id}`}
          showDashboard
          onLogout={logout}
        />

        {/* Project Hero Header */}
        <div className="project-hero mb-6">
          <div className="project-hero-inner">
            {/* Left: project identity */}
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="project-status-badge">
                  <span className="project-status-dot" />
                  {project?.status === "completed" ? "Completed" : "Active"}
                </span>
              </div>
              <h1 className="project-hero-title">
                {project?.title || `Project ${id}`}
              </h1>
              {project?.description && (
                <p className="project-hero-desc">{project.description}</p>
              )}
            </div>

            {/* Right: quick actions */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                  className="btn-primary flex items-center gap-2 !py-2 !text-sm"
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

        {/* AI Copilot */}
        <ProjectCopilot projectId={id} />

        {/* Tab navigation */}
        <div className="tab-bar mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn${activeTab === tab.key ? " tab-btn-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="tab-content-area">
          {/* Overview */}
          {activeTab === "overview" && (
            <ProjectOverview projectId={id} project={project} />
          )}

          {/* Tasks */}
          {activeTab === "tasks" && canSeeTaskBoard && (
            <TaskBoard projectId={id} />
          )}
          {activeTab === "tasks" && !canSeeTaskBoard && (
            <div className="permission-denied-card">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
              </svg>
              <p className="text-slate-300 font-medium">
                No task management permission
              </p>
              <p className="text-sm text-slate-500">
                Ask the project creator to grant you access.
              </p>
            </div>
          )}

          {/* Milestones */}
          {activeTab === "milestones" && <Milestones projectId={id} />}

          {/* Files */}
          {activeTab === "files" && canSeeFileCard && (
            <FileUpload projectId={id} />
          )}
          {activeTab === "files" && !canSeeFileCard && (
            <div className="permission-denied-card">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
              </svg>
              <p className="text-slate-300 font-medium">
                No file management permission
              </p>
              <p className="text-sm text-slate-500">
                Ask the project creator to grant you access.
              </p>
            </div>
          )}

          {/* Chat */}
          {activeTab === "chat" && canSeeChatCard && <ChatBox projectId={id} />}
          {activeTab === "chat" && !canSeeChatCard && (
            <div className="permission-denied-card">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
              </svg>
              <p className="text-slate-300 font-medium">
                Chat permission denied
              </p>
              <p className="text-sm text-slate-500">
                Ask the project creator to enable chat for you.
              </p>
            </div>
          )}

          {/* Analytics */}
          {activeTab === "analytics" && <Analytics projectId={id} />}
        </div>
      </div>
    </div>
  );
}
