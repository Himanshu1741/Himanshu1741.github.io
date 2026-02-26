import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "../services/api";
import Navbar from "../components/layout/Navbar";

export default function UnifiedTrashPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const [user, setUser] = useState(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectTrashItems, setProjectTrashItems] = useState([]);
  const [taskTrashItems, setTaskTrashItems] = useState([]);
  const [fileTrashItems, setFileTrashItems] = useState([]);
  const [canViewProjectItems, setCanViewProjectItems] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const loadProjectTrash = async () => {
    const res = await API.get("/projects/trash");
    setProjectTrashItems(res.data || []);
  };

  const loadProjectItemTrash = async (id) => {
    const [tasksRes, filesRes] = await Promise.all([
      API.get(`/tasks/trash/${id}`),
      API.get(`/files/trash/project/${id}`)
    ]);
    setTaskTrashItems(tasksRes.data || []);
    setFileTrashItems(filesRes.data || []);
  };

  useEffect(() => {
    if (!router.isReady) return;

    const init = async () => {
      setLoading(true);
      setError("");
      setCanViewProjectItems(false);
      setTaskTrashItems([]);
      setFileTrashItems([]);

      try {
        if (!localStorage.getItem("token")) {
          router.push("/login");
          return;
        }

        const meRes = await API.get("/auth/me");
        const currentUser = meRes.data?.user || null;
        setUser(currentUser);
        if (currentUser) {
          localStorage.setItem("user", JSON.stringify(currentUser));
        }

        await loadProjectTrash();

        if (projectId) {
          const projectsRes = await API.get("/projects");
          const currentProject = (projectsRes.data || []).find((p) => String(p.id) === String(projectId));

          if (!currentProject) {
            setError("Project not found");
          } else {
            setProjectTitle(currentProject.title || `Project ${projectId}`);
            const isCreator = Boolean(currentUser && currentProject.created_by === currentUser.id);
            setCanViewProjectItems(isCreator);

            if (isCreator) {
              await loadProjectItemTrash(projectId);
            }
          }
        }
      } catch (e) {
        if (e?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        setError(e?.response?.data?.message || "Failed to load trash");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router.isReady, projectId]);

  const refreshAll = async () => {
    await loadProjectTrash();
    if (projectId && canViewProjectItems) {
      await loadProjectItemTrash(projectId);
    }
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
            <div className="hero-tag">Unified recycle bin</div>
            <h1 className="hero-headline">
              Manage
              <br />
              deleted <em>projects</em>
              <br />
              and items.
            </h1>
            <p className="hero-sub">
              Restore from trash or permanently delete. Permanent delete cannot be recovered.
            </p>
          </div>
        </section>

        <section className="right dashboard-right">
          <div className="dashboard-content">
            <Navbar title="Trash" showDashboard onLogout={logout} />

            <section className="panel-card mb-6 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Project Trash Box</h3>
                <button className="btn-secondary" onClick={() => router.push(projectId ? `/project/${projectId}` : "/dashboard")}>
                  {projectId ? "Back to Project" : "Back to Dashboard"}
                </button>
              </div>

              {loading ? <p className="text-slate-300">Loading trash...</p> : null}
              {error ? <p className="text-rose-300">{error}</p> : null}

              {!loading && !error ? (
                projectTrashItems.length === 0 ? (
                  <p className="text-sm text-slate-400">No deleted projects in trash.</p>
                ) : (
                  <div className="space-y-3">
                    {projectTrashItems.map((item) => (
                      <div key={item.id} className="surface-soft p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium text-slate-100">{item.title}</p>
                            <p className="text-xs text-slate-400">
                              Deleted at: {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "N/A"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              className="btn-primary"
                              onClick={async () => {
                                try {
                                  await API.post(`/projects/trash/${item.id}/restore`);
                                  await refreshAll();
                                } catch (e) {
                                  alert(e?.response?.data?.message || "Failed to restore project");
                                }
                              }}
                            >
                              Restore
                            </button>
                            <button
                              className="btn-danger"
                              onClick={async () => {
                                const confirmed = window.confirm("Delete this project forever? This cannot be recovered.");
                                if (!confirmed) return;
                                try {
                                  await API.delete(`/projects/trash/${item.id}/permanent`);
                                  await refreshAll();
                                } catch (e) {
                                  alert(e?.response?.data?.message || "Failed to permanently delete project");
                                }
                              }}
                            >
                              Delete Forever
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </section>

            {projectId && canViewProjectItems ? (
              <section className="panel-card p-5">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  {projectTitle || `Project ${projectId}`} Item Trash
                </h3>

                {taskTrashItems.length === 0 && fileTrashItems.length === 0 ? (
                  <p className="text-sm text-slate-400">No deleted tasks or files for this project.</p>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-2 text-base font-semibold text-white">Deleted Tasks</h4>
                      {taskTrashItems.length === 0 ? (
                        <p className="text-sm text-slate-400">No deleted tasks.</p>
                      ) : (
                        <div className="space-y-2">
                          {taskTrashItems.map((item) => (
                            <div key={`task-${item.id}`} className="surface-soft p-3">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-medium text-slate-100">{item.title}</p>
                                  <p className="text-xs text-slate-400">Status: {item.status}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="btn-primary"
                                    onClick={async () => {
                                      try {
                                        await API.post(`/tasks/${item.id}/restore`);
                                        await refreshAll();
                                      } catch (e) {
                                        alert(e?.response?.data?.message || "Failed to restore task");
                                      }
                                    }}
                                  >
                                    Restore
                                  </button>
                                  <button
                                    className="btn-danger"
                                    onClick={async () => {
                                      const confirmed = window.confirm("Delete this task forever? This cannot be recovered.");
                                      if (!confirmed) return;
                                      try {
                                        await API.delete(`/tasks/trash/${item.id}/permanent`);
                                        await refreshAll();
                                      } catch (e) {
                                        alert(e?.response?.data?.message || "Failed to permanently delete task");
                                      }
                                    }}
                                  >
                                    Delete Forever
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="mb-2 text-base font-semibold text-white">Deleted Files</h4>
                      {fileTrashItems.length === 0 ? (
                        <p className="text-sm text-slate-400">No deleted files.</p>
                      ) : (
                        <div className="space-y-2">
                          {fileTrashItems.map((item) => (
                            <div key={`file-${item.id}`} className="surface-soft p-3">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-medium text-slate-100">{item.filename || "Unnamed file"}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="btn-primary"
                                    onClick={async () => {
                                      try {
                                        await API.post(`/files/trash/${item.id}/restore`);
                                        await refreshAll();
                                      } catch (e) {
                                        alert(e?.response?.data?.message || "Failed to restore file");
                                      }
                                    }}
                                  >
                                    Restore
                                  </button>
                                  <button
                                    className="btn-danger"
                                    onClick={async () => {
                                      const confirmed = window.confirm("Delete this file forever? This cannot be recovered.");
                                      if (!confirmed) return;
                                      try {
                                        await API.delete(`/files/trash/${item.id}/permanent`);
                                        await refreshAll();
                                      } catch (e) {
                                        alert(e?.response?.data?.message || "Failed to permanently delete file");
                                      }
                                    }}
                                  >
                                    Delete Forever
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
