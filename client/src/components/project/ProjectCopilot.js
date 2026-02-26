import { useEffect, useState } from "react";
import API from "../../services/api";

export default function ProjectCopilot({ projectId }) {
  const [copilot, setCopilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCopilot = async ({ silent = false } = {}) => {
    if (!projectId) return;
    if (!silent || !copilot) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError("");
    try {
      const res = await API.get(`/projects/${projectId}/copilot`);
      setCopilot(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to load copilot");
      if (!copilot) {
        setCopilot(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCopilot();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return undefined;
    const intervalId = setInterval(() => {
      loadCopilot({ silent: true });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [projectId]);

  return (
    <section className="panel-card mb-6 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">AI Project Copilot</h3>
          <p className="text-sm text-slate-300">
            Per-project assistant summarizing chat, tasks, and files.
          </p>
          {refreshing ? (
            <p className="mt-1 text-xs text-cyan-300">Refreshing...</p>
          ) : null}
        </div>
        <button className="btn-secondary" onClick={() => loadCopilot({ silent: true })} disabled={loading || refreshing}>
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {loading || refreshing ? "Refreshing..." : "Refresh Copilot"}
          </span>
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!error && loading && !copilot ? (
        <div className="text-sm text-slate-300">Generating project brief...</div>
      ) : null}

      {!error && copilot ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-cyan-500/30 bg-slate-900/50 p-4">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">What changed today</h4>
            <ul className="space-y-2 text-sm text-slate-100">
              {copilot.what_changed_today?.map((item, idx) => (
                <li key={idx} className="rounded-lg bg-slate-800/70 px-3 py-2">{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-slate-900/50 p-4">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">Next best actions</h4>
            <ul className="space-y-2 text-sm text-slate-100">
              {copilot.next_best_actions?.map((item, idx) => (
                <li key={idx} className="rounded-lg bg-slate-800/70 px-3 py-2">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
