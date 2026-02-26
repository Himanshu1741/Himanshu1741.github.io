import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import API from "../../services/api";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await API.get(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults =
    results &&
    (results.projects?.length ||
      results.tasks?.length ||
      results.messages?.length ||
      results.files?.length);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          className="input-modern pl-9"
          placeholder="Search projects, tasks, messages…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-4 w-4 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
          {!hasResults && !loading && (
            <p className="px-4 py-3 text-sm text-slate-400">No results found for &ldquo;{query}&rdquo;</p>
          )}

          {results?.projects?.length > 0 && (
            <div className="p-2">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Projects</p>
              {results.projects.map((p) => (
                <button
                  key={p.id}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() => { router.push(`/project/${p.id}`); setOpen(false); setQuery(""); }}
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
                  {p.title}
                </button>
              ))}
            </div>
          )}

          {results?.tasks?.length > 0 && (
            <div className="border-t border-slate-800 p-2">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Tasks</p>
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() => { router.push(`/project/${t.project_id}`); setOpen(false); setQuery(""); }}
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-xs text-slate-500">{t.project_title}</span>
                </button>
              ))}
            </div>
          )}

          {results?.messages?.length > 0 && (
            <div className="border-t border-slate-800 p-2">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Messages</p>
              {results.messages.map((m) => (
                <button
                  key={m.id}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() => { router.push(`/project/${m.project_id}`); setOpen(false); setQuery(""); }}
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="flex-1 truncate">{m.content}</span>
                  <span className="text-xs text-slate-500">{m.project_title}</span>
                </button>
              ))}
            </div>
          )}

          {results?.files?.length > 0 && (
            <div className="border-t border-slate-800 p-2">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Files</p>
              {results.files.map((f) => (
                <button
                  key={f.id}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() => { router.push(`/project/${f.project_id}`); setOpen(false); setQuery(""); }}
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
                  <span className="flex-1 truncate">{f.filename}</span>
                  <span className="text-xs text-slate-500">{f.project_title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
