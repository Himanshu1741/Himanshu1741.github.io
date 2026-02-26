import { useEffect, useState } from "react";
import API from "../../services/api";

export default function Milestones({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", due_date: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setCurrentUser(JSON.parse(u));
  }, []);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await API.get(`/milestones/${projectId}`);
      setMilestones(res.data);
    } catch {
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await API.post("/milestones", { project_id: projectId, ...form });
      setForm({ title: "", description: "", due_date: "" });
      setShowForm(false);
      await load();
    } catch {
      alert("Failed to create milestone");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await API.put(`/milestones/${id}`, { status: "completed" });
      await load();
    } catch {
      alert("Failed to update milestone");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      await API.delete(`/milestones/${id}`);
      await load();
    } catch {
      alert("Failed to delete milestone");
    }
  };

  const isOverdue = (due) => due && new Date(due) < new Date();

  return (
    <section className="panel-card mb-6 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">Milestones</h3>
        <button
          className="btn-primary !px-3 !py-1.5 text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "+ New Milestone"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="surface-soft mb-4 space-y-3 p-4">
          <input
            className="input-modern"
            placeholder="Milestone title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            className="input-modern min-h-[64px] resize-y"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-400">Due Date</label>
              <input
                type="date"
                className="input-modern"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? "Creating…" : "Create Milestone"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading milestones…</p>
      ) : milestones.length === 0 ? (
        <div className="surface-soft p-4 text-center text-sm text-slate-400">
          No milestones yet. Create one to track project progress.
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const total = m.task_count || 0;
            const done = m.done_count || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const overdue = m.status !== "completed" && isOverdue(m.due_date);

            return (
              <div key={m.id} className="surface-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-100 truncate">{m.title}</p>
                      {m.status === "completed" ? (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300">Completed</span>
                      ) : overdue ? (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-300">Overdue</span>
                      ) : (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">Open</span>
                      )}
                    </div>
                    {m.description && <p className="mt-0.5 text-sm text-slate-400 truncate">{m.description}</p>}
                    {m.due_date && (
                      <p className={`mt-0.5 text-xs ${overdue ? "text-rose-400" : "text-slate-500"}`}>
                        Due: {new Date(m.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {m.status !== "completed" && (
                      <button
                        className="btn-secondary !px-2 !py-1 text-xs"
                        onClick={() => handleComplete(m.id)}
                        title="Mark as completed"
                      >
                        ✓ Complete
                      </button>
                    )}
                    {currentUser && m.created_by === currentUser.id && (
                      <button
                        className="btn-danger !px-2 !py-1 text-xs"
                        onClick={() => handleDelete(m.id)}
                        title="Delete milestone"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{done}/{total} tasks done</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-400" : "bg-cyan-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
