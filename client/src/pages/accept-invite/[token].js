import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "../../services/api";

export default function AcceptInvitePage() {
  const router = useRouter();
  const { token } = router.query;

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [projectTitle, setProjectTitle] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    if (!localStorage.getItem("token")) {
      router.push(`/login?redirect=/accept-invite/${token}`);
    }
  }, [router.isReady, token, router]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await API.post(`/projects/invite/accept/${token}`);
      setProjectId(res.data.project_id);
      setProjectTitle(res.data.project_title || "");
      setStatus("success");
    } catch (err) {
      setMessage(
        err?.response?.data?.message || "Failed to accept the invitation.",
      );
      setStatus("error");
    }
  };

  // Redirect to project after success
  useEffect(() => {
    if (status === "success" && projectId) {
      const t = setTimeout(() => router.push(`/project/${projectId}`), 2500);
      return () => clearTimeout(t);
    }
  }, [status, projectId, router]);

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--bg)" }}
      className="flex items-center justify-center p-6"
    >
      {/* Background decoration */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.025) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="panel-card p-8 text-center shadow-2xl">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/25">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-cyan-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {status === "idle" && (
            <>
              <h1 className="mb-2 text-xl font-bold text-white">
                Project Invitation
              </h1>
              <p className="mb-6 text-sm text-slate-400">
                You have been invited to collaborate on a project. Click{" "}
                <strong className="text-slate-200">Accept</strong> to join.
              </p>
              <button
                className="btn-primary w-full justify-center"
                onClick={handleAccept}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Accept Invitation
              </button>
              <button
                className="mt-3 text-sm text-slate-500 hover:text-slate-300 transition"
                onClick={() => router.push("/dashboard")}
              >
                Decline — go to dashboard
              </button>
            </>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <p className="text-sm text-slate-400">Joining project…</p>
            </div>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="mb-1 text-lg font-bold text-white">
                You&apos;re in!
              </h2>
              <p className="text-sm text-slate-300">
                Successfully joined{" "}
                <strong className="text-cyan-300">
                  {projectTitle || "the project"}
                </strong>
                .
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Redirecting to project…
              </p>
              {projectId && (
                <button
                  className="btn-primary mt-4 w-full justify-center"
                  onClick={() => router.push(`/project/${projectId}`)}
                >
                  Go to Project Now
                </button>
              )}
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-rose-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-white">
                Invitation Failed
              </h2>
              <p className="mb-4 text-sm text-slate-300">{message}</p>
              <button
                className="btn-secondary w-full justify-center"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
