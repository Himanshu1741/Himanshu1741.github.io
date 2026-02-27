import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "../../../components/layout/Navbar";
import API from "../../../services/api";

export default function ProjectSettingsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState(null);
  const [memberIdentifier, setMemberIdentifier] = useState("");
  const [members, setMembers] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    title: "",
    description: "",
  });
  const [statusForm, setStatusForm] = useState("active");
  const [newMemberConfig, setNewMemberConfig] = useState({
    member_role: "member",
    can_manage_tasks: true,
    can_manage_files: true,
    can_chat: true,
    can_change_project_name: false,
    can_add_members: false,
  });
  const [projectPermissions, setProjectPermissions] = useState({
    can_add_members: false,
    can_change_project_name: false,
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
    const loadPageData = async () => {
      if (!id) return;
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        const user = JSON.parse(storedUser);
        const projectRes = await API.get(`/projects/${id}/detail`);
        const currentProject = projectRes.data;

        if (!currentProject) {
          router.push("/dashboard");
          return;
        }

        setProject(currentProject);
        setSettingsForm({
          title: currentProject.title || "",
          description: currentProject.description || "",
        });
        setStatusForm(currentProject.status || "active");

        const creator = Boolean(currentProject.created_by === user.id);
        setIsCreator(creator);

        const permRes = await API.get(`/projects/${id}/permissions`);
        const perms = permRes.data?.permissions || {};
        setProjectPermissions({
          can_add_members: Boolean(perms.can_add_members),
          can_change_project_name: Boolean(perms.can_change_project_name),
        });

        if (creator) {
          const membersRes = await API.get(`/projects/${id}/members`);
          setMembers(membersRes.data.members || []);
        }
      } catch {
        router.push(`/project/${id}`);
      }
    };

    loadPageData();
  }, [id, router]);

  const canEditProject =
    isCreator || projectPermissions.can_change_project_name;
  const canAddMembers = isCreator;

  const updateMemberPermission = async (memberId, key, value) => {
    try {
      const res = await API.put(
        `/projects/${id}/members/${memberId}/permissions`,
        {
          [key]: value,
        },
      );

      const updated = res.data?.membership;
      if (updated) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  can_manage_tasks: updated.can_manage_tasks,
                  can_manage_files: updated.can_manage_files,
                  can_chat: updated.can_chat,
                  can_change_project_name: updated.can_change_project_name,
                  can_add_members: updated.can_add_members,
                  member_role: updated.member_role,
                }
              : m,
          ),
        );
      }
    } catch (error) {
      alert(
        error?.response?.data?.message || "Failed to update member permission",
      );
    }
  };

  if (!id) return null;

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
            <div className="hero-tag">Project settings</div>
            <h1 className="hero-headline">
              Configure
              <br />
              <em>{project?.title || "project"}</em>
              <br />
              access.
            </h1>
            <p className="hero-sub">
              Manage members, roles, permissions, and project status from one
              place.
            </p>
          </div>
        </section>

        <section className="right dashboard-right">
          <div className="dashboard-content">
            <Navbar
              title={`Project Settings: ${project?.title || id}`}
              showDashboard
              onLogout={logout}
            />

            <div className="mb-6">
              <button
                className="btn-secondary w-full sm:w-auto"
                onClick={() => router.push(`/project/${id}`)}
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
                      d="M15 18l-6-6 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Back to Project
                </span>
              </button>
            </div>

            {canAddMembers ? (
              <div className="panel-card mb-6 p-5">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Add Member
                </h3>
                <div className="flex flex-col gap-2 md:flex-row">
                  <input
                    className="input-modern"
                    placeholder="Username or Email"
                    value={memberIdentifier}
                    onChange={(e) => setMemberIdentifier(e.target.value)}
                  />
                  <button
                    className="btn-primary w-full md:w-auto"
                    onClick={async () => {
                      if (!memberIdentifier.trim()) {
                        alert("Please enter username or email");
                        return;
                      }
                      try {
                        if (!newMemberConfig.member_role.trim()) {
                          alert("Role is mandatory");
                          return;
                        }

                        const payload = {
                          project_id: Number(id),
                          username: memberIdentifier.trim(),
                          member_role: newMemberConfig.member_role.trim(),
                          can_manage_tasks: newMemberConfig.can_manage_tasks,
                          can_manage_files: newMemberConfig.can_manage_files,
                          can_chat: newMemberConfig.can_chat,
                          can_change_project_name:
                            newMemberConfig.can_change_project_name,
                          can_add_members: newMemberConfig.can_add_members,
                        };

                        await API.post("/projects/add-member", payload);
                        alert("Member added successfully");
                        setMemberIdentifier("");
                        setNewMemberConfig({
                          member_role: "member",
                          can_manage_tasks: true,
                          can_manage_files: true,
                          can_chat: true,
                          can_change_project_name: false,
                          can_add_members: false,
                        });
                        if (isCreator) {
                          const membersRes = await API.get(
                            `/projects/${id}/members`,
                          );
                          setMembers(membersRes.data.members || []);
                        }
                      } catch (error) {
                        alert(
                          error?.response?.data?.message ||
                            "Failed to add member",
                        );
                      }
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
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                      Add Member
                    </span>
                  </button>
                </div>
                {isCreator ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      Role
                      <input
                        className="rounded bg-slate-900 px-2 py-1 text-xs text-slate-100"
                        value={newMemberConfig.member_role}
                        onChange={(e) =>
                          setNewMemberConfig((prev) => ({
                            ...prev,
                            member_role: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(newMemberConfig.can_manage_tasks)}
                        onChange={(e) =>
                          setNewMemberConfig((prev) => ({
                            ...prev,
                            can_manage_tasks: e.target.checked,
                          }))
                        }
                      />
                      Manage Tasks
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(newMemberConfig.can_manage_files)}
                        onChange={(e) =>
                          setNewMemberConfig((prev) => ({
                            ...prev,
                            can_manage_files: e.target.checked,
                          }))
                        }
                      />
                      Manage Files
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(newMemberConfig.can_chat)}
                        onChange={(e) =>
                          setNewMemberConfig((prev) => ({
                            ...prev,
                            can_chat: e.target.checked,
                          }))
                        }
                      />
                      Chat
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(
                          newMemberConfig.can_change_project_name,
                        )}
                        onChange={(e) =>
                          setNewMemberConfig((prev) => ({
                            ...prev,
                            can_change_project_name: e.target.checked,
                          }))
                        }
                      />
                      Change Project Name
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(newMemberConfig.can_add_members)}
                        onChange={(e) =>
                          setNewMemberConfig((prev) => ({
                            ...prev,
                            can_add_members: e.target.checked,
                          }))
                        }
                      />
                      Add Members
                    </label>
                  </div>
                ) : null}
              </div>
            ) : null}

            {canEditProject ? (
              <div className="panel-card mb-6 p-5">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Update Project
                </h3>
                <div className="grid gap-2">
                  <input
                    className="input-modern"
                    placeholder="Project title"
                    value={settingsForm.title}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        title: e.target.value,
                      })
                    }
                  />
                  <textarea
                    className="input-modern min-h-24"
                    placeholder="Project description"
                    value={settingsForm.description}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        description: e.target.value,
                      })
                    }
                  />
                  <button
                    className="btn-primary w-full sm:w-fit"
                    onClick={async () => {
                      if (!window.confirm("Save project settings changes?")) {
                        return;
                      }
                      try {
                        const res = await API.put(`/projects/${id}`, {
                          title: settingsForm.title,
                          description: settingsForm.description,
                        });
                        const savedProject = res.data.project;
                        setProject(savedProject);
                        setSettingsForm((prev) => ({
                          ...prev,
                        }));
                        alert("Project updated successfully");
                      } catch (error) {
                        alert(
                          error?.response?.data?.message ||
                            "Failed to update project",
                        );
                      }
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
                        <path
                          d="M5 12l4 4L19 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Save Changes
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {isCreator ? (
              <div className="panel-card mb-6 p-5">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Project Status
                </h3>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <select
                    className="input-modern md:max-w-xs"
                    value={statusForm}
                    onChange={(e) => setStatusForm(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    className="btn-primary w-full sm:w-fit"
                    onClick={async () => {
                      try {
                        const res = await API.put(`/projects/${id}/status`, {
                          status: statusForm,
                        });
                        setProject(res.data.project);
                        alert("Project status updated successfully");
                      } catch (error) {
                        alert(
                          error?.response?.data?.message ||
                            "Failed to update project status",
                        );
                      }
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
                        <path
                          d="M5 12l4 4L19 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Save Status
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {isCreator ? (
              <div className="panel-card mb-6 p-5">
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Manage Members
                </h3>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg bg-slate-800 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          {m.name} {m.is_creator ? "(Creator)" : ""}
                        </p>
                        <p className="text-xs text-slate-300">{m.email}</p>
                        <p className="text-xs text-slate-400">
                          Role: {m.member_role || "member"}
                        </p>
                      </div>

                      {!m.is_creator ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <label className="flex items-center gap-2 text-xs text-slate-200">
                            Role
                            <input
                              className="rounded bg-slate-900 px-2 py-1 text-xs text-slate-100"
                              value={m.member_role || ""}
                              placeholder="Enter custom role"
                              onChange={(e) => {
                                const nextRole = e.target.value;
                                setMembers((prev) =>
                                  prev.map((x) =>
                                    x.id === m.id
                                      ? { ...x, member_role: nextRole }
                                      : x,
                                  ),
                                );
                              }}
                              onBlur={(e) =>
                                updateMemberPermission(
                                  m.id,
                                  "member_role",
                                  e.target.value,
                                )
                              }
                            />
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-200">
                            <input
                              type="checkbox"
                              checked={Boolean(m.can_manage_tasks)}
                              onChange={(e) =>
                                updateMemberPermission(
                                  m.id,
                                  "can_manage_tasks",
                                  e.target.checked,
                                )
                              }
                            />
                            Manage Tasks
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-200">
                            <input
                              type="checkbox"
                              checked={Boolean(m.can_manage_files)}
                              onChange={(e) =>
                                updateMemberPermission(
                                  m.id,
                                  "can_manage_files",
                                  e.target.checked,
                                )
                              }
                            />
                            Manage Files
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-200">
                            <input
                              type="checkbox"
                              checked={Boolean(m.can_chat)}
                              onChange={(e) =>
                                updateMemberPermission(
                                  m.id,
                                  "can_chat",
                                  e.target.checked,
                                )
                              }
                            />
                            Chat
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-200">
                            <input
                              type="checkbox"
                              checked={Boolean(m.can_change_project_name)}
                              onChange={(e) =>
                                updateMemberPermission(
                                  m.id,
                                  "can_change_project_name",
                                  e.target.checked,
                                )
                              }
                            />
                            Change Project Name
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-200">
                            <input
                              type="checkbox"
                              checked={Boolean(m.can_add_members)}
                              onChange={(e) =>
                                updateMemberPermission(
                                  m.id,
                                  "can_add_members",
                                  e.target.checked,
                                )
                              }
                            />
                            Add Members
                          </label>
                          <button
                            className="btn-danger w-full sm:w-auto"
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Remove ${m.name} from this project?`,
                                )
                              ) {
                                return;
                              }
                              try {
                                await API.delete(
                                  `/projects/${id}/members/${m.id}`,
                                );
                                setMembers((prev) =>
                                  prev.filter((x) => x.id !== m.id),
                                );
                              } catch (error) {
                                alert(
                                  error?.response?.data?.message ||
                                    "Failed to remove member",
                                );
                              }
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
                              Remove
                            </span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
