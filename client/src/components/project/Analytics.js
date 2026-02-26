import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import API from "../../services/api";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const chartDefaults = {
  responsive: true,
  plugins: {
    legend: {
      labels: { color: "#cbd5e1" }
    }
  }
};

export default function Analytics({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [taskRes, timeRes] = await Promise.all([
          API.get(`/tasks/${projectId}`),
          API.get(`/time-logs/project/${projectId}`)
        ]);
        setTasks(taskRes.data);
        setTimeLogs(timeRes.data);
      } catch {
        // skip
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // Task status doughnut
  const statusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length
  };

  const doughnutData = {
    labels: ["To Do", "In Progress", "Completed"],
    datasets: [
      {
        data: [statusCounts.todo, statusCounts.in_progress, statusCounts.completed],
        backgroundColor: ["rgba(245, 158, 11, 0.7)", "rgba(56, 189, 248, 0.7)", "rgba(52, 211, 153, 0.7)"],
        borderColor: ["rgb(245, 158, 11)", "rgb(56, 189, 248)", "rgb(52, 211, 153)"],
        borderWidth: 1
      }
    ]
  };

  // Priority distribution bar chart
  const priorityCounts = {
    low: tasks.filter((t) => t.priority === "low").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    high: tasks.filter((t) => t.priority === "high").length
  };

  const barData = {
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        label: "Tasks by Priority",
        data: [priorityCounts.low, priorityCounts.medium, priorityCounts.high],
        backgroundColor: ["rgba(52, 211, 153, 0.7)", "rgba(56, 189, 248, 0.7)", "rgba(239, 68, 68, 0.7)"],
        borderRadius: 6
      }
    ]
  };

  // Time logged per member (from timeLogs summary)
  const timeByMember = timeLogs.reduce((acc, log) => {
    const name = log.member_name || log.user_name || `User ${log.user_id}`;
    acc[name] = (acc[name] || 0) + parseFloat(log.total_hours || log.hours || 0);
    return acc;
  }, {});

  const memberNames = Object.keys(timeByMember);
  const memberHours = Object.values(timeByMember);

  const timeBarData = {
    labels: memberNames.length > 0 ? memberNames : ["No data"],
    datasets: [
      {
        label: "Hours Logged",
        data: memberHours.length > 0 ? memberHours : [0],
        backgroundColor: "rgba(139, 92, 246, 0.7)",
        borderRadius: 6
      }
    ]
  };

  // Task completion over time (line chart - group completed tasks by day)
  const completedByDay = tasks
    .filter((t) => t.status === "completed" && t.updated_at)
    .reduce((acc, t) => {
      const day = t.updated_at.slice(0, 10);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

  const sortedDays = Object.keys(completedByDay).sort();
  let running = 0;
  const cumulativeCounts = sortedDays.map((d) => { running += completedByDay[d]; return running; });

  const lineData = {
    labels: sortedDays.length > 0 ? sortedDays : ["No data"],
    datasets: [
      {
        label: "Cumulative Completed Tasks",
        data: cumulativeCounts.length > 0 ? cumulativeCounts : [0],
        borderColor: "rgb(52, 211, 153)",
        backgroundColor: "rgba(52, 211, 153, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(52, 211, 153)"
      }
    ]
  };

  const completion = tasks.length > 0 ? Math.round((statusCounts.completed / tasks.length) * 100) : 0;

  return (
    <section className="panel-card mb-6 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">Project Analytics</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
          {completion}% complete
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading analytics…</p>
      ) : tasks.length === 0 ? (
        <div className="surface-soft p-4 text-center text-sm text-slate-400">
          No task data available yet.
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Tasks", value: tasks.length, color: "text-slate-200" },
              { label: "To Do", value: statusCounts.todo, color: "text-amber-300" },
              { label: "In Progress", value: statusCounts.in_progress, color: "text-sky-300" },
              { label: "Completed", value: statusCounts.completed, color: "text-emerald-300" }
            ].map((s) => (
              <div key={s.label} className="surface-soft p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Status doughnut */}
            <div className="surface-soft p-4">
              <h4 className="mb-3 text-sm font-medium text-slate-300">Tasks by Status</h4>
              <div className="mx-auto max-w-[220px]">
                <Doughnut
                  data={doughnutData}
                  options={{
                    ...chartDefaults,
                    plugins: { ...chartDefaults.plugins, legend: { position: "bottom", labels: { color: "#cbd5e1", padding: 12 } } }
                  }}
                />
              </div>
            </div>

            {/* Priority bar */}
            <div className="surface-soft p-4">
              <h4 className="mb-3 text-sm font-medium text-slate-300">Tasks by Priority</h4>
              <Bar
                data={barData}
                options={{
                  ...chartDefaults,
                  scales: {
                    x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
                    y: { ticks: { color: "#94a3b8", stepSize: 1 }, grid: { color: "rgba(148,163,184,0.1)" } }
                  }
                }}
              />
            </div>

            {/* Completion line chart */}
            {sortedDays.length > 0 && (
              <div className="surface-soft p-4 sm:col-span-2">
                <h4 className="mb-3 text-sm font-medium text-slate-300">Task Completion Over Time</h4>
                <Line
                  data={lineData}
                  options={{
                    ...chartDefaults,
                    scales: {
                      x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
                      y: { ticks: { color: "#94a3b8", stepSize: 1 }, grid: { color: "rgba(148,163,184,0.1)" } }
                    }
                  }}
                />
              </div>
            )}

            {/* Time per member */}
            {memberNames.length > 0 && (
              <div className="surface-soft p-4 sm:col-span-2">
                <h4 className="mb-3 text-sm font-medium text-slate-300">Hours Logged per Member</h4>
                <Bar
                  data={timeBarData}
                  options={{
                    ...chartDefaults,
                    scales: {
                      x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
                      y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
