import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import API from "../services/api";
import Navbar from "../components/layout/Navbar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

ChartJS.register(CategoryScale, LinearScale, BarElement);

export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const loadAdminData = async () => {
    const [usersRes, projectsRes] = await Promise.all([
      API.get("/admin/users"),
      API.get("/admin/projects"),
    ]);
    setUsers(usersRes.data);
    setProjects(projectsRes.data);
  };

  const loadAnalytics = async () => {
    const res = await API.get("/admin/analytics");
    setAnalytics(res.data);
  };

  const refreshAll = async () => {
    await Promise.all([loadAnalytics(), loadAdminData()]);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    if (!parsedUser || parsedUser.role !== "admin") {
      router.push("/login");
      return;
    }

    refreshAll().catch(() => router.push("/login"));
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) =>
      `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query),
    );
  }, [users, searchQuery]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((p) =>
      `${p.title} ${p.description || ""}`.toLowerCase().includes(query),
    );
  }, [projects, searchQuery]);

  const currentCount =
    activeTab === "users" ? filteredUsers.length : filteredProjects.length;

  if (!user) return null;

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
            <div className="hero-tag">Admin control center</div>
            <h1 className="hero-headline">
              Manage
              <br />
              <em>users</em> and
              <br />
              projects.
            </h1>
            <p className="hero-sub">
              System-wide moderation and visibility for platform operations.
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-num">{analytics?.totalUsers ?? 0}</div>
              <div className="stat-label">Total users</div>
            </div>
            <div className="stat">
              <div className="stat-num">{analytics?.totalProjects ?? 0}</div>
              <div className="stat-label">Total projects</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                {analytics?.totalActiveProjects ?? 0}
              </div>
              <div className="stat-label">Active projects</div>
            </div>
          </div>
        </section>

        <section className="right dashboard-right">
          <div className="dashboard-content">
            <Navbar
              title="Admin Control Center"
              showDashboard
              onLogout={logout}
            />

            <section className="panel-card mb-6 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-300">
                    Control panel for moderation and system operations
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Signed in as {user.name}{" "}
                    <span className="text-cyan-300">({user.role})</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => router.push("/settings")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
                        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
                      </svg>
                      Settings
                    </span>
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => router.push("/dashboard?preview=member")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Preview Member Dashboard
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {analytics ? (
              <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="glass-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Total Users
                  </p>
                  <p className="mt-1 text-3xl font-bold text-cyan-300">
                    {analytics.totalUsers}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Total Projects
                  </p>
                  <p className="mt-1 text-3xl font-bold text-emerald-300">
                    {analytics.totalProjects}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Active Projects
                  </p>
                  <p className="mt-1 text-3xl font-bold text-blue-300">
                    {analytics.totalActiveProjects ?? 0}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Admin Accounts
                  </p>
                  <p className="mt-1 text-3xl font-bold text-fuchsia-300">
                    {users.filter((u) => u.role === "admin").length}
                  </p>
                </div>
              </section>
            ) : null}

            {analytics ? (
              <section className="panel-card mb-6 p-5">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  System Overview
                </h3>
                <div className="h-56">
                  <Bar
                    data={{
                      labels: ["Users", "Projects", "Active Projects"],
                      datasets: [
                        {
                          label: "System Data",
                          data: [
                            analytics.totalUsers,
                            analytics.totalProjects,
                            analytics.totalActiveProjects ?? 0,
                          ],
                          backgroundColor: ["#06b6d4", "#22c55e", "#3b82f6"],
                          borderRadius: 8,
                        },
                      ],
                    }}
                    options={barOptions}
                  />
                </div>
              </section>
            ) : null}

            <section className="panel-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    className={
                      activeTab === "users" ? "btn-primary" : "btn-secondary"
                    }
                    onClick={() => setActiveTab("users")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                      </svg>
                      Manage Users
                    </span>
                  </button>
                  <button
                    className={
                      activeTab === "projects" ? "btn-primary" : "btn-secondary"
                    }
                    onClick={() => setActiveTab("projects")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 7h18M3 12h18M3 17h18" />
                      </svg>
                      Manage Projects
                    </span>
                  </button>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                  {currentCount} shown
                </span>
              </div>

              <input
                className="input-modern mb-4"
                placeholder={
                  activeTab === "users"
                    ? "Search users by name, email, role"
                    : "Search projects by title or description"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {activeTab === "users" ? (
                <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 md:flex md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-100">{u.name}</p>
                        <p className="text-sm text-slate-400">{u.email}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {u.role}
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2 md:mt-0">
                        {u.role !== "admin" ? (
                          <button
                            className="btn-secondary"
                            onClick={async () => {
                              await API.put(`/admin/users/promote/${u.id}`);
                              await refreshAll();
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
                                  d="M12 19V5M5 12l7-7 7 7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Promote
                            </span>
                          </button>
                        ) : null}
                        {u.role === "admin" && u.id !== user.id ? (
                          <button
                            className="btn-secondary"
                            onClick={async () => {
                              await API.put(`/admin/users/demote/${u.id}`);
                              await refreshAll();
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
                                  d="M12 5v14M19 12l-7 7-7-7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Demote
                            </span>
                          </button>
                        ) : null}
                        {u.id !== user.id ? (
                          <button
                            className="btn-danger"
                            onClick={async () => {
                              await API.delete(`/admin/users/${u.id}`);
                              await refreshAll();
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
                              Delete
                            </span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 md:flex md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-100">
                          {project.title}
                        </p>
                        <p className="text-sm text-slate-400">
                          {project.description || "No description"}
                        </p>
                      </div>
                      <button
                        className="btn-danger mt-3 md:mt-0"
                        onClick={async () => {
                          await API.delete(`/admin/projects/${project.id}`);
                          await refreshAll();
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
                          Delete
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
