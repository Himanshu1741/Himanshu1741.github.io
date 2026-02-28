import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppLayout from "../../../components/layout/AppLayout";
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
  const [user, setUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState("idle"); // idle | loading | success | error
  const [inviteMsg, setInviteMsg] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
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

  if (!id || !user) return null;

  return (
    <AppLayout user={user} activeTab="dashboard" onLogout={logout}>
      <div className="space-y-5">

        {/* ── Breadcrumb ─────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </button>
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <button onClick={() => router.push(`/project/${id}`)}
            className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            {project?.title || `Project ${id}`}
          </button>
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="font-medium text-slate-600 dark:text-slate-400">Settings</span>
        </nav>

        {/* ── Hero banner ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-500/8 blur-3xl"/>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Project Settings
              </p>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {project?.title || `Project ${id}`}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage members, roles, permissions and project status.
              </p>
            </div>
            <button onClick={() => router.push(`/project/${id}`)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Project
            </button>
          </div>
        </div>

        {/* ── Add Member card ──────────────────────────────── */}
        {canAddMembers && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
              </svg>
              Add Member
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-cyan-500"
                placeholder="Username or Email"
                value={memberIdentifier}
                onChange={(e) => setMemberIdentifier(e.target.value)}
              />
              <button
                className="shrink-0 rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-400 active:scale-95 sm:w-auto"
                onClick={async () => {
                  if (!memberIdentifier.trim()) { alert("Please enter username or email"); return; }
                  try {
                    if (!newMemberConfig.member_role.trim()) { alert("Role is mandatory"); return; }
                    const payload = {
                      project_id: Number(id), username: memberIdentifier.trim(),
                      member_role: newMemberConfig.member_role.trim(),
                      can_manage_tasks: newMemberConfig.can_manage_tasks,
                      can_manage_files: newMemberConfig.can_manage_files,
                      can_chat: newMemberConfig.can_chat,
                      can_change_project_name: newMemberConfig.can_change_project_name,
                      can_add_members: newMemberConfig.can_add_members,
                    };
                    await API.post("/projects/add-member", payload);
                    alert("Member added successfully");
                    setMemberIdentifier("");
                    setNewMemberConfig({ member_role: "member", can_manage_tasks: true, can_manage_files: true, can_chat: true, can_change_project_name: false, can_add_members: false });
                    if (isCreator) { const r = await API.get(`/projects/${id}/members`); setMembers(r.data.members || []); }
                  } catch (error) { alert(error?.response?.data?.message || "Failed to add member"); }
                }}
              >
                + Add Member
              </button>
            </div>
            {isCreator && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-10 shrink-0 text-slate-500">Role</span>
                  <input
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    value={newMemberConfig.member_role}
                    onChange={(e) => setNewMemberConfig(p => ({ ...p, member_role: e.target.value }))}
                  />
                </label>
                {[
                  ["can_manage_tasks","Manage Tasks"],["can_manage_files","Manage Files"],["can_chat","Chat"],
                  ["can_change_project_name","Change Name"],["can_add_members","Add Members"],
                ].map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <input type="checkbox" className="accent-cyan-500 h-3.5 w-3.5" checked={Boolean(newMemberConfig[key])}
                      onChange={(e) => setNewMemberConfig(p => ({ ...p, [key]: e.target.checked }))}/>
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Update Project card ──────────────────────────── */}
        {canEditProject && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" strokeLinecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Update Project
            </h3>
            <div className="grid gap-3">
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-600"
                placeholder="Project title"
                value={settingsForm.title}
                onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
              />
              <textarea
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-600"
                placeholder="Project description"
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
              />
              <button
                className="w-full rounded-xl bg-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-400 active:scale-95 sm:w-fit"
                onClick={async () => {
                  if (!window.confirm("Save project settings changes?")) return;
                  try {
                    const res = await API.put(`/projects/${id}`, { title: settingsForm.title, description: settingsForm.description });
                    setProject(res.data.project); alert("Project updated successfully");
                  } catch (error) { alert(error?.response?.data?.message || "Failed to update project"); }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ── Project Status card ──────────────────────────── */}
        {isCreator && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/>
              </svg>
              Project Status
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 sm:max-w-xs"
                value={statusForm}
                onChange={(e) => setStatusForm(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <button
                className="shrink-0 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400 active:scale-95"
                onClick={async () => {
                  try {
                    const res = await API.put(`/projects/${id}/status`, { status: statusForm });
                    setProject(res.data.project); alert("Project status updated successfully");
                  } catch (error) { alert(error?.response?.data?.message || "Failed to update project status"); }
                }}
              >
                Save Status
              </button>
            </div>
          </div>
        )}

        {/* ── Invite by Email card ───────────────────────────── */}
        {isCreator && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinejoin="round"/>
                <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Invite by Email
            </h3>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-600">
              Send an email invitation link. The recipient must have an account with that email.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="email"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-600"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteStatus("idle"); setInviteMsg(""); }}
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("send-invite-btn").click()}
              />
              <button
                id="send-invite-btn"
                disabled={inviteStatus === "loading"}
                className="shrink-0 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-400 active:scale-95 disabled:opacity-60"
                onClick={async () => {
                  if (!inviteEmail.trim()) { setInviteMsg("Please enter an email."); setInviteStatus("error"); return; }
                  setInviteStatus("loading"); setInviteMsg("");
                  try {
                    await API.post("/projects/invite", { project_id: Number(id), email: inviteEmail.trim() });
                    setInviteStatus("success"); setInviteMsg(`Invitation sent to ${inviteEmail.trim()}`); setInviteEmail("");
                  } catch (err) {
                    setInviteStatus("error"); setInviteMsg(err?.response?.data?.message || "Failed to send invitation.");
                  }
                }}
              >
                {inviteStatus === "loading" ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>
                    Sending…
                  </span>
                ) : "Send Invite"}
              </button>
            </div>
            {inviteMsg && (
              <p className={`mt-2 text-xs ${inviteStatus === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {inviteMsg}
              </p>
            )}
          </div>
        )}

        {/* ── Manage Members card ─────────────────────────── */}
        {isCreator && members.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
              </svg>
              Manage Members
              <span className="ml-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                {members.length}
              </span>
            </h3>
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {m.name}
                        {m.is_creator && (
                          <span className="ml-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">Owner</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">{m.email}</p>
                      <p className="mt-0.5 text-xs capitalize text-slate-400 dark:text-slate-600">
                        Role: {m.member_role || "member"}
                      </p>
                    </div>
                    {!m.is_creator && (
                      <button
                        className="shrink-0 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-400"
                        onClick={async () => {
                          if (!window.confirm(`Remove ${m.name} from this project?`)) return;
                          try {
                            await API.delete(`/projects/${id}/members/${m.id}`);
                            setMembers(prev => prev.filter(x => x.id !== m.id));
                          } catch (error) { alert(error?.response?.data?.message || "Failed to remove member"); }
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {!m.is_creator && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-8 shrink-0 text-slate-500">Role</span>
                        <input
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          value={m.member_role || ""}
                          placeholder="Custom role"
                          onChange={(e) => { const r = e.target.value; setMembers(prev => prev.map(x => x.id === m.id ? { ...x, member_role: r } : x)); }}
                          onBlur={(e) => updateMemberPermission(m.id, "member_role", e.target.value)}
                        />
                      </label>
                      {[
                        ["can_manage_tasks","Manage Tasks"],["can_manage_files","Manage Files"],["can_chat","Chat"],
                        ["can_change_project_name","Change Name"],["can_add_members","Add Members"],
                      ].map(([key, label]) => (
                        <label key={key} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <input type="checkbox" className="accent-cyan-500 h-3.5 w-3.5" checked={Boolean(m[key])}
                            onChange={(e) => updateMemberPermission(m.id, key, e.target.checked)}/>
                          {label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pb-6"/>
      </div>
    </AppLayout>
  );
}

