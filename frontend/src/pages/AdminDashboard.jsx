import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import api from "../api/client";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../utils/format";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    api.get("/tasks/stats/dashboard").then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, []);
  if (loading) return <Spinner />;
  const chartData = {
    labels: ["Interns", "Projects", "Tasks", "Pending", "Completed", "Overdue"],
    datasets: [{ label: "Overview", backgroundColor: "#2374e1", data: [stats.totalInterns, stats.totalProjects, stats.totalTasks, stats.pendingTasks, stats.completedTasks, stats.overdueTasks] }]
  };
  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">Jump to common admin areas.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => navigate('/admin/board')}>Open Board</button>
            <button className="btn-secondary" onClick={() => navigate('/admin/projects')}>Projects</button>
            <button className="btn-secondary" onClick={() => navigate('/admin/interns')}>Interns</button>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total interns" value={stats.totalInterns} />
        <StatCard title="Total projects" value={stats.totalProjects} tone="green" />
        <StatCard title="Total tasks" value={stats.totalTasks} />
        <StatCard title="Pending tasks" value={stats.pendingTasks} tone="amber" />
        <StatCard title="Completed tasks" value={stats.completedTasks} tone="slate" />
        <StatCard title="In progress" value={stats.inProgressTasks} />
        <StatCard title="Overdue tasks" value={stats.overdueTasks} tone="amber" />
        <StatCard title="Due this week" value={stats.tasksDueThisWeek} tone="green" />
      </div>
      <section className="card">
        <div className="flex items-center justify-between text-sm"><span>Task completion rate</span><b>{stats.taskCompletionRate}%</b></div>
        <div className="mt-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-3 rounded-full bg-brand-600" style={{ width: `${stats.taskCompletionRate}%` }} /></div>
      </section>
      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Dashboard chart</h2>
        <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </section>
      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
        {stats.recentActivity?.length ? (
          <div className="grid gap-2">
            {stats.recentActivity.map((it) => (
              <div key={it._id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700 flex items-start justify-between">
                <div role="button" className="flex-1" onClick={() => {
                  if (it.task) navigate(`/admin/board?openTask=${it.task}${it.project ? `&project=${it.project}` : ""}`);
                  else if (it.project) navigate(`/admin/projects/${it.project}`);
                }}>
                  <div className="font-medium">{it.actor?.name || 'System'}</div>
                  <div className="mt-1 text-xs text-slate-600">{it.message}</div>
                  <div className="mt-2 text-xs text-slate-400">{formatDate(it.createdAt)}</div>
                </div>
                <div className="shrink-0 text-xs text-slate-500 ml-4">{it.action}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">No recent activity.</p>}
      </section>
    </div>
  );
}
