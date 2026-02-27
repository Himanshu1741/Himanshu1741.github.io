import { useState } from "react";
import { useRouter } from "next/router";

const quickPrompts = [
  "help",
  "list projects",
  "show active projects",
  "How do I start?",
  "create project Demo App | Initial setup",
  "open settings",
];

function buildGuideReply(input, { user, projects }) {
  const text = (input || "").toLowerCase();
  const firstProjectId = projects?.[0]?.id;
  const projectCount = projects?.length || 0;

  if (text.includes("start") || text.includes("new")) {
    return {
      message:
        "Start with Create Project. Then open your project and use Tasks, Files, and Chat. Finally, update account details in Settings.",
      actions: [
        { label: "Go to Create Project", type: "create_project" },
        { label: "Open Settings", type: "route", path: "/settings" },
      ],
    };
  }

  if (text.includes("create") || text.includes("project")) {
    return {
      message:
        "Use the Create Project card on this dashboard. Add a title and description, then open the new project from My Project Access.",
      actions: [
        { label: "Go to Create Project", type: "create_project" },
        ...(projectCount > 0
          ? [{ label: "My Projects", type: "route", path: "/dashboard" }]
          : []),
      ],
    };
  }

  if (text.includes("task") || text.includes("chat") || text.includes("file")) {
    if (!firstProjectId) {
      return {
        message:
          "You need at least one project first. Create a project, then open it to access Task Board, File Upload, and Chat.",
        actions: [{ label: "Create First Project", type: "create_project" }],
      };
    }

    return {
      message:
        "Open any project to access Task Board, File Upload, and Team Chat in one place.",
      actions: [
        {
          label: "Open First Project",
          type: "route",
          path: `/project/${firstProjectId}`,
        },
      ],
    };
  }

  if (text.includes("notification") || text.includes("setting")) {
    return {
      message:
        "Notifications are in the bell icon on the top card. Account changes are in Settings.",
      actions: [{ label: "Open Settings", type: "route", path: "/settings" }],
    };
  }

  if (user?.role === "admin" && text.includes("admin")) {
    return {
      message:
        "As admin, you can manage users and projects from Admin Control Center.",
      actions: [{ label: "Open Admin", type: "route", path: "/admin" }],
    };
  }

  return {
    message:
      "I can guide you through projects, tasks, chat, files, notifications, and settings. Try a quick prompt below.",
    actions: [],
  };
}

function parseCommand(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  const help = raw.match(/^(help|commands)$/i);
  if (help) return { type: "help" };

  const listProjects = raw.match(/^list\s+projects$/i);
  if (listProjects) return { type: "list_projects" };

  const createMatch = raw.match(/^create\s+project\s*:?\s+(.+)$/i);
  if (createMatch) {
    const payload = createMatch[1].trim();
    const [titlePart, descriptionPart] = payload.split("|");
    return {
      type: "create_project",
      title: (titlePart || "").trim(),
      description: (descriptionPart || "").trim(),
    };
  }

  const openSettings = raw.match(/^open\s+settings$/i);
  if (openSettings) return { type: "open_settings" };

  const openDashboard = raw.match(/^open\s+dashboard$/i);
  if (openDashboard) return { type: "open_dashboard" };

  const openAdmin = raw.match(/^open\s+admin$/i);
  if (openAdmin) return { type: "open_admin" };

  const openProject = raw.match(/^open\s+project\s+(.+)$/i);
  if (openProject)
    return { type: "open_project", project: openProject[1].trim() };

  const openProjectSettings = raw.match(/^open\s+project\s+settings\s+(.+)$/i);
  if (openProjectSettings)
    return {
      type: "open_project_settings",
      project: openProjectSettings[1].trim(),
    };

  const deleteProject = raw.match(/^delete\s+project\s+(.+)$/i);
  if (deleteProject)
    return { type: "delete_project", project: deleteProject[1].trim() };

  const completeProject = raw.match(/^complete\s+project\s+(.+)$/i);
  if (completeProject)
    return {
      type: "set_project_status",
      project: completeProject[1].trim(),
      status: "completed",
    };

  const activateProject = raw.match(/^activate\s+project\s+(.+)$/i);
  if (activateProject)
    return {
      type: "set_project_status",
      project: activateProject[1].trim(),
      status: "active",
    };

  const renameProject = raw.match(/^rename\s+project\s+(.+)\s+\|\s+(.+)$/i);
  if (renameProject) {
    return {
      type: "rename_project",
      project: renameProject[1].trim(),
      title: renameProject[2].trim(),
    };
  }

  const updateProjectDescription = raw.match(
    /^update\s+project\s+description\s+(.+)\s+\|\s+(.+)$/i,
  );
  if (updateProjectDescription) {
    return {
      type: "update_project_description",
      project: updateProjectDescription[1].trim(),
      description: updateProjectDescription[2].trim(),
    };
  }

  const showProjects = raw.match(/^show\s+(active|completed)\s+projects$/i);
  if (showProjects)
    return { type: "show_projects", status: showProjects[1].toLowerCase() };

  const searchProjects = raw.match(/^search\s+project\s+(.+)$/i);
  if (searchProjects)
    return { type: "search_project", query: searchProjects[1].trim() };

  const clearSearch = raw.match(/^clear\s+search$/i);
  if (clearSearch) return { type: "clear_search" };

  const gotoCreate = raw.match(/^(go\s+to\s+)?create\s+project$/i);
  if (gotoCreate) return { type: "go_create_project" };

  const logout = raw.match(/^logout$/i);
  if (logout) return { type: "logout" };

  return null;
}

export default function NewUserGuide({
  user,
  projects,
  onCreateProject,
  onExecuteCommand,
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [runningCommand, setRunningCommand] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      message: `Hi ${user?.name?.split(" ")[0] || "there"}, I can help you navigate this website and run commands like: create project Demo App | Initial setup`,
      actions: [],
    },
  ]);

  const askGuide = async (input) => {
    const trimmed = (input || "").trim();
    if (!trimmed) return;

    const command = parseCommand(trimmed);
    if (command && onExecuteCommand) {
      setMessages((prev) => [
        ...prev,
        { role: "user", message: trimmed, actions: [] },
      ]);
      setRunningCommand(true);
      try {
        const result = await onExecuteCommand(command);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            message: result?.message || "Command executed.",
            actions: result?.actions || [],
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            message: "I could not run that command. Please try again.",
            actions: [],
          },
        ]);
      } finally {
        setRunningCommand(false);
        setQuery("");
      }
      return;
    }

    const reply = buildGuideReply(trimmed, { user, projects });
    setMessages((prev) => [
      ...prev,
      { role: "user", message: trimmed, actions: [] },
      {
        role: "assistant",
        message: reply.message,
        actions: reply.actions || [],
      },
    ]);
    setQuery("");
  };

  const handleAction = (action) => {
    if (!action) return;
    if (action.type === "route" && action.path) {
      router.push(action.path);
      return;
    }
    if (action.type === "create_project") {
      onCreateProject?.();
    }
  };

  return (
    <section className="panel-card mb-6 p-5">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">AI New User Guide</h3>
        <p className="text-sm text-slate-300">
          Ask how to use features and jump to the right page quickly.
        </p>
      </div>

      <div className="space-y-2">
        {messages.slice(-4).map((item, idx) => (
          <div
            key={`${item.role}-${idx}`}
            className={`rounded-xl px-3 py-2 text-sm ${item.role === "assistant" ? "bg-slate-800/70 text-slate-100" : "bg-cyan-500/15 text-cyan-100"}`}
          >
            {item.message}
            {item.actions?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.actions.map((action) => (
                  <button
                    key={action.label}
                    className="btn-secondary !px-3 !py-1.5 text-xs"
                    onClick={() => handleAction(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            className="btn-secondary !px-3 !py-1.5 text-xs"
            onClick={() => askGuide(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input-modern"
          placeholder="Type command (help)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              askGuide(query);
            }
          }}
        />
        <button
          className="btn-primary shrink-0"
          onClick={() => askGuide(query)}
          disabled={runningCommand}
        >
          {runningCommand ? "Running..." : "Ask"}
        </button>
      </div>
    </section>
  );
}
