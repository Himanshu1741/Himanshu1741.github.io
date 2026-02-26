import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  high:   "bg-rose-500/20 text-rose-300 border border-rose-500/30",
  medium: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  low:    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
};

const STATUS_COLUMNS = [
  { key: "todo",        label: "To Do"       },
  { key: "in_progress", label: "In Progress"  },
  { key: "completed",   label: "Completed"    }
];

const STATUS_HEADER = {
  todo:        "border-amber-500/40 text-amber-300",
  in_progress: "border-sky-500/40 text-sky-300",
  completed:   "border-emerald-500/40 text-emerald-300"
};

// ─── Droppable column ─────────────────────────────────────────────────────────
function KanbanColumn({ columnKey, label, tasks, children }) {
  const { isOver, setNodeRef } = useDroppable({ id: columnKey });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[180px] flex-col gap-2 rounded-2xl border p-3 transition
        ${STATUS_HEADER[columnKey]}
        ${isOver ? "bg-white/5 ring-1 ring-cyan-400/30" : "bg-slate-900/40"}`}
    >
      <div className={`mb-1 flex items-center justify-between border-b pb-2 ${STATUS_HEADER[columnKey]}`}>
        <span className="text-sm font-semibold">{label}</span>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{tasks.length}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Draggable task card ──────────────────────────────────────────────────────
function TaskCard({ task, canManage, canDelete, members, onDelete, onEdit, onOpenDetail }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(task.id) });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 999 }
    : {};

  const isOverdue = task.due_date && task.status !== "completed" && new Date(task.due_date) < new Date();
  const assigneeName = task.assigned_to
    ? (members.find((m) => m.user_id === task.assigned_to)?.name || `User #${task.assigned_to}`)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`surface-soft cursor-grab rounded-xl p-3 text-left active:cursor-grabbing
        ${isDragging ? "opacity-50 shadow-2xl ring-1 ring-cyan-400/50" : ""}`}
    >
      <div className="mb-1 flex items-start gap-2">
        <span {...listeners} {...attributes}
          className="mt-0.5 shrink-0 cursor-grab text-slate-500 active:cursor-grabbing" title="Drag to move">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
          </svg>
        </span>
        <p className="flex-1 text-sm font-medium leading-snug text-slate-100">{task.title}</p>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {task.priority && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
        )}
        {task.due_date && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isOverdue ? "bg-rose-600/20 text-rose-300 border border-rose-500/40" : "bg-slate-700/50 text-slate-300"
          }`}>
            {isOverdue ? "⚠ " : "📅 "}{task.due_date}
          </span>
        )}
        {assigneeName && (
          <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[11px] text-violet-300">
            👤 {assigneeName}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <button className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white transition"
          onClick={() => onOpenDetail(task)}>Details</button>
        {canManage && (
          <button className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white transition"
            onClick={() => onEdit(task)}>Edit</button>
        )}
        {canDelete && (
          <button className="rounded-lg bg-rose-900/30 px-2 py-1 text-[11px] text-rose-300 hover:text-white transition"
            onClick={() => onDelete(task.id)}>Delete</button>
        )}
      </div>
    </div>
  );
}

// ─── Create / Edit task modal ─────────────────────────────────────────────────
function TaskFormModal({ task, milestones, members, projectId, onClose, onSaved }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    due_date: task?.due_date || "",
    assigned_to: task?.assigned_to || "",
    milestone_id: task?.milestone_id || "",
    estimated_hours: task?.estimated_hours || ""
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        priority: form.priority,
        due_date: form.due_date || null,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        milestone_id: form.milestone_id ? Number(form.milestone_id) : null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null
      };
      if (isEdit) {
        await API.put(`/tasks/${task.id}`, payload);
      } else {
        await API.post("/tasks", { ...payload, project_id: projectId });
      }
      onSaved();
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold text-white">{isEdit ? "Edit Task" : "New Task"}</h3>
        <div className="flex flex-col gap-3">
          <input className="input-modern" placeholder="Title *" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea className="input-modern min-h-[70px] resize-y" placeholder="Description (optional)"
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Priority</label>
              <select className="input-modern" value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Due Date</label>
              <input type="date" className="input-modern" value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Assign to member</label>
            <select className="input-modern" value={form.assigned_to}
              onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Milestone</label>
              <select className="input-modern" value={form.milestone_id}
                onChange={(e) => setForm((f) => ({ ...f, milestone_id: e.target.value }))}>
                <option value="">None</option>
                {milestones.map((ms) => <option key={ms.id} value={ms.id}>{ms.title}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Est. Hours</label>
              <input type="number" step="0.5" min="0" className="input-modern" placeholder="e.g. 2.5"
                value={form.estimated_hours}
                onChange={(e) => setForm((f) => ({ ...f, estimated_hours: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task detail modal (comments + time logs) ─────────────────────────────────
function TaskDetailModal({ task, currentUser, onClose }) {
  const [comments, setComments] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [timeForm, setTimeForm] = useState({ hours: "", note: "", logged_date: new Date().toISOString().split("T")[0] });
  const [tab, setTab] = useState("comments");

  const loadComments = useCallback(async () => {
    try { const r = await API.get(`/task-comments/${task.id}`); setComments(r.data); } catch {}
  }, [task.id]);

  const loadTimeLogs = useCallback(async () => {
    try { const r = await API.get(`/time-logs/task/${task.id}`); setTimeLogs(r.data); } catch {}
  }, [task.id]);

  useEffect(() => { loadComments(); loadTimeLogs(); }, [loadComments, loadTimeLogs]);

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      await API.post(`/task-comments/${task.id}`, { content: newComment.trim() });
      setNewComment(""); loadComments();
    } catch (err) { alert(err?.response?.data?.message || "Failed to post comment"); }
  };

  const logTime = async () => {
    if (!timeForm.hours || Number(timeForm.hours) <= 0) { alert("Hours must be > 0"); return; }
    try {
      await API.post(`/time-logs/task/${task.id}`, timeForm);
      setTimeForm({ hours: "", note: "", logged_date: new Date().toISOString().split("T")[0] });
      loadTimeLogs();
    } catch (err) { alert(err?.response?.data?.message || "Failed to log time"); }
  };

  const totalLogged = timeLogs.reduce((s, l) => s + Number(l.hours), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-white">{task.title}</h3>
            {task.description && <p className="mt-1 text-xs text-slate-400">{task.description}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {task.priority && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>}
              {task.due_date && <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[11px] text-slate-300">📅 {task.due_date}</span>}
              {task.estimated_hours && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] text-violet-300">⏱ {task.estimated_hours}h est</span>}
            </div>
          </div>
          <button className="text-slate-400 hover:text-white transition" onClick={onClose}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-slate-700">
          {["comments", "time"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition ${tab === t ? "border-b-2 border-cyan-400 text-cyan-400" : "text-slate-400 hover:text-white"}`}>
              {t === "comments" ? `Comments (${comments.length})` : `Time Logs (${totalLogged.toFixed(1)}h)`}
            </button>
          ))}
        </div>

        <div className="px-6 py-4">
          {tab === "comments" && (
            <>
              <div className="mb-3 max-h-60 space-y-2 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs text-slate-500">No comments yet.</p>}
                {comments.map((c) => (
                  <div key={c.id} className="surface-soft rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-cyan-400">{c.user_name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">{c.created_at?.slice(0, 10)}</span>
                        {(currentUser?.id === c.user_id || currentUser?.role === "admin") && (
                          <button onClick={async () => { try { await API.delete(`/task-comments/${c.id}`); loadComments(); } catch {} }}
                            className="text-rose-400 hover:text-rose-300 transition text-[10px]">✕</button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-200">{c.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input-modern flex-1 text-sm" placeholder="Add a comment…"
                  value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()} />
                <button className="btn-primary px-3" onClick={addComment}>Post</button>
              </div>
            </>
          )}

          {tab === "time" && (
            <>
              <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
                {timeLogs.length === 0 && <p className="text-xs text-slate-500">No time logged yet.</p>}
                {timeLogs.map((l) => (
                  <div key={l.id} className="surface-soft flex items-center justify-between rounded-xl px-3 py-2">
                    <div>
                      <span className="text-xs font-semibold text-cyan-400">{l.user_name}</span>
                      <span className="ml-2 text-xs text-slate-300">{l.hours}h on {l.logged_date}</span>
                      {l.note && <span className="ml-2 text-xs text-slate-400">— {l.note}</span>}
                    </div>
                    {(currentUser?.id === l.user_id || currentUser?.role === "admin") && (
                      <button onClick={async () => { try { await API.delete(`/time-logs/${l.id}`); loadTimeLogs(); } catch {} }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 transition">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" step="0.25" min="0.25" className="input-modern text-sm" placeholder="Hours"
                  value={timeForm.hours} onChange={(e) => setTimeForm((f) => ({ ...f, hours: e.target.value }))} />
                <input className="input-modern text-sm" placeholder="Note (opt.)"
                  value={timeForm.note} onChange={(e) => setTimeForm((f) => ({ ...f, note: e.target.value }))} />
                <input type="date" className="input-modern text-sm" value={timeForm.logged_date}
                  onChange={(e) => setTimeForm((f) => ({ ...f, logged_date: e.target.value }))} />
              </div>
              <button className="btn-primary mt-2 w-full" onClick={logTime}>Log Time</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main TaskBoard ───────────────────────────────────────────────────────────
export default function TaskBoard({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [canDeleteTasks, setCanDeleteTasks] = useState(false);
  const [canManageTasks, setCanManageTasks] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await API.get(`/tasks/${projectId}`);
      setTasks(res.data);
    } catch (err) {
      if (err?.response?.status !== 403) throw err;
      setTasks([]);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUser(JSON.parse(stored));

    const loadAll = async () => {
      await loadTasks();
      try { const r = await API.get(`/projects/${projectId}/member-list`); setMembers(r.data || []); } catch {}
      try { const r = await API.get(`/milestones/${projectId}`); setMilestones(r.data || []); } catch {}
      try {
        const user = stored ? JSON.parse(stored) : null;
        const res = await API.get("/projects");
        const p = res.data.find((pr) => String(pr.id) === String(projectId));
        setCanDeleteTasks(Boolean(p && user && p.created_by === user.id));
      } catch { setCanDeleteTasks(false); }
      try {
        const r = await API.get(`/projects/${projectId}/permissions`);
        setCanManageTasks(Boolean(r.data?.permissions?.can_manage_tasks));
      } catch { setCanManageTasks(false); }
    };

    loadAll();
  }, [projectId, loadTasks]);

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = over.id;
    if (!["todo", "in_progress", "completed"].includes(newStatus)) return;

    setTasks((prev) => prev.map((t) => (String(t.id) === taskId ? { ...t, status: newStatus } : t)));
    try { await API.put(`/tasks/${taskId}`, { status: newStatus }); }
    catch { await loadTasks(); }
  };

  const deleteTask = async (id) => {
    try { await API.delete(`/tasks/${id}`); await loadTasks(); }
    catch (err) { alert(err?.response?.data?.message || "Failed to delete task"); }
  };

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const overdueSoon = tasks.filter((t) => {
    if (!t.due_date || t.status === "completed") return false;
    const diff = (new Date(t.due_date) - new Date()) / 86400000;
    return diff >= 0 && diff <= 3;
  });

  return (
    <section className="panel-card mb-6 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white">Task Board</h3>
          <p className="text-xs text-slate-400">{tasks.length} task{tasks.length !== 1 ? "s" : ""} · drag cards to update status</p>
        </div>
        {canManageTasks && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New Task
            </span>
          </button>
        )}
      </div>

      {overdueSoon.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
          ⚡ {overdueSoon.length} task{overdueSoon.length > 1 ? "s" : ""} due within 3 days
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {STATUS_COLUMNS.map(({ key, label }) => (
            <KanbanColumn key={key} columnKey={key} label={label} tasks={tasksByStatus(key)}>
              {tasksByStatus(key).map((task) => (
                <TaskCard key={task.id} task={task} canManage={canManageTasks} canDelete={canDeleteTasks}
                  members={members} onDelete={deleteTask} onEdit={setEditingTask} onOpenDetail={setDetailTask} />
              ))}
              {tasksByStatus(key).length === 0 && (
                <p className="py-4 text-center text-xs text-slate-600">Drop tasks here</p>
              )}
            </KanbanColumn>
          ))}
        </div>
      </DndContext>

      {showCreateModal && (
        <TaskFormModal task={null} milestones={milestones} members={members} projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => { setShowCreateModal(false); loadTasks(); }} />
      )}
      {editingTask && (
        <TaskFormModal task={editingTask} milestones={milestones} members={members} projectId={projectId}
          onClose={() => setEditingTask(null)}
          onSaved={() => { setEditingTask(null); loadTasks(); }} />
      )}
      {detailTask && (
        <TaskDetailModal task={detailTask} currentUser={currentUser}
          onClose={() => setDetailTask(null)} />
      )}
    </section>
  );
}
