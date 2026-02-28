import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import API from "../services/api";
import AppLayout from "../components/layout/AppLayout";

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, toast };
}
function ToastContainer({ toasts }) {
  const c = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  };
  return (
    <div
      className="fixed right-5 top-5 z-[9999] flex flex-col gap-2"
      style={{ pointerEvents: "none" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm ${c[t.type]}`}
          style={{
            pointerEvents: "auto",
            animation: "slideInRight 0.25s ease",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  variant = "danger",
}) {
  if (!open) return null;
  const btnStl =
    variant === "warning"
      ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
      : "bg-rose-500 hover:bg-rose-400 text-white";
  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
        <p className="mb-5 text-sm text-slate-400">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${btnStl}`}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
function DaysLeftBadge({ deletedAt }) {
  const deleted = new Date(deletedAt);
  const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(
    0,
    Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const color =
    daysLeft <= 5
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : daysLeft <= 10
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-slate-700 bg-slate-800 text-slate-400";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}
    >
      {daysLeft}d left
    </span>
  );
}
export default function TrashPage() {
  const [user, setUser] = useState(null);
  const [trashedProjects, setTrashedProjects] = useState([]);
  const [trashedTasks, setTrashedTasks] = useState([]);
  const [tab, setTab] = useState("projects");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "danger",
  });
  const { toasts, toast } = useToast();
  const router = useRouter();

  const ask = (title, message, onConfirm, variant = "danger") =>
    setConfirm({ open: true, title, message, onConfirm, variant });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const loadTrash = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes] = await Promise.allSettled([
        API.get("/projects/trash"),
        API.get("/tasks/trash"),
      ]);
      if (projRes.status === "fulfilled")
        setTrashedProjects(projRes.value.data || []);
      if (taskRes.status === "fulfilled")
        setTrashedTasks(taskRes.value.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    API.get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      })
      .catch(() => router.push("/login"));
    loadTrash();
  }, []);

  const restoreProject = (id, title) =>
    ask(
      "Restore Project",
      `Restore "${title}" to active projects?`,
      async () => {
        closeConfirm();
        try {
          await API.post(`/projects/${id}/restore`);
          toast(`"${title}" restored`, "success");
          await loadTrash();
        } catch (err) {
          toast(err?.response?.data?.message || "Restore failed", "error");
        }
      },
      "warning",
    );
  const deleteProjectPermanent = (id, title) =>
    ask(
      "Permanently Delete",
      `Delete "${title}" forever? This cannot be undone.`,
      async () => {
        closeConfirm();
        try {
          await API.delete(`/projects/${id}/permanent`);
          toast(`"${title}" permanently deleted`, "success");
          await loadTrash();
        } catch (err) {
          toast(err?.response?.data?.message || "Delete failed", "error");
        }
      },
    );
  const restoreTask = (id, title) =>
    ask(
      "Restore Task",
      `Restore "${title}"?`,
      async () => {
        closeConfirm();
        try {
          await API.post(`/tasks/${id}/restore`);
          toast(`"${title}" restored`, "success");
          await loadTrash();
        } catch (err) {
          toast(err?.response?.data?.message || "Restore failed", "error");
        }
      },
      "warning",
    );
  const deleteTaskPermanent = (id, title) =>
    ask(
      "Permanently Delete Task",
      `Permanently delete "${title}"? This cannot be undone.`,
      async () => {
        closeConfirm();
        try {
          await API.delete(`/tasks/trash/${id}/permanent`);
          toast(`"${title}" permanently deleted`, "success");
          await loadTrash();
        } catch (err) {
          toast(err?.response?.data?.message || "Delete failed", "error");
        }
      },
    );
  const emptyTrash = () => {
    const total = trashedProjects.length + trashedTasks.length;
    if (total === 0) {
      toast("Trash is already empty", "info");
      return;
    }
    ask(
      "Empty Trash",
      `Permanently delete all ${total} item(s)? This cannot be undone.`,
      async () => {
        closeConfirm();
        try {
          await Promise.allSettled([
            ...trashedProjects.map((p) =>
              API.delete(`/projects/${p.id}/permanent`),
            ),
            ...trashedTasks.map((t) =>
              API.delete(`/tasks/trash/${t.id}/permanent`),
            ),
          ]);
          toast("Trash emptied", "success");
          await loadTrash();
        } catch {
          toast("Some items could not be deleted", "error");
        }
      },
    );
  };

  if (!user) return null;
  const totalItems = trashedProjects.length + trashedTasks.length;
  return (
    <>
      <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}`}</style>
      <ToastContainer toasts={toasts} />
      <ConfirmModal {...confirm} onCancel={closeConfirm} />
      <AppLayout user={user} activeTab="trash" onLogout={logout}>
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-rose-500/8 blur-3xl" />
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-rose-500">
              Recycle Bin
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Trash &amp; Recovery
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Deleted items are retained for 30 days before being permanently
              removed.
            </p>
            {totalItems > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  {totalItems} item{totalItems !== 1 ? "s" : ""} in trash
                </span>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                  onClick={emptyTrash}
                >
                  Empty Trash
                </button>
              </div>
            )}
          </div>
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1 gap-1">
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "projects" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500 hover:text-slate-300"}`}
              onClick={() => setTab("projects")}
            >
              Projects{" "}
              {trashedProjects.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                  {trashedProjects.length}
                </span>
              )}
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "tasks" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500 hover:text-slate-300"}`}
              onClick={() => setTab("tasks")}
            >
              Tasks{" "}
              {trashedTasks.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                  {trashedTasks.length}
                </span>
              )}
            </button>
          </div>
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-12 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : tab === "projects" ? (
            <div className="space-y-3">
              {trashedProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 py-12 text-center text-sm text-slate-600">
                  No deleted projects.
                </div>
              ) : (
                trashedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-100">
                            {p.title}
                          </h4>
                          {p.deleted_at && (
                            <DaysLeftBadge deletedAt={p.deleted_at} />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {p.description || "No description"}
                        </p>
                        {p.deleted_at && (
                          <p className="mt-1 text-[11px] text-slate-600">
                            Deleted{" "}
                            {new Date(p.deleted_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                          onClick={() => restoreProject(p.id, p.title)}
                        >
                          Restore
                        </button>
                        <button
                          className="inline-flex items-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                          onClick={() => deleteProjectPermanent(p.id, p.title)}
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {trashedTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 py-12 text-center text-sm text-slate-600">
                  No deleted tasks.
                </div>
              ) : (
                trashedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-100">
                            {t.title}
                          </h4>
                          {t.deleted_at && (
                            <DaysLeftBadge deletedAt={t.deleted_at} />
                          )}
                          {t.status && (
                            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                              {t.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {t.description || "No description"}
                        </p>
                        {t.deleted_at && (
                          <p className="mt-1 text-[11px] text-slate-600">
                            Deleted{" "}
                            {new Date(t.deleted_at).toLocaleDateString()}
                            {t.project_title && (
                              <>
                                {" "}
                                &middot; from{" "}
                                <strong className="text-slate-400">
                                  {t.project_title}
                                </strong>
                              </>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                          onClick={() => restoreTask(t.id, t.title)}
                        >
                          Restore
                        </button>
                        <button
                          className="inline-flex items-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                          onClick={() => deleteTaskPermanent(t.id, t.title)}
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
