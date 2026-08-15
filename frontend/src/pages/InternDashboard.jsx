import React, { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { moneylessPercent } from "../utils/format";

export default function InternDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get("/tasks/stats/dashboard").then((res) => setStats(res.data));
  }, []);
  if (!stats) return <Spinner />;
  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-xl font-bold">Welcome, {user.name}</h2>
        <p className="mt-1 text-sm text-slate-500">Track your onboarding tasks and download documents from one workspace.</p>
        <div className="mt-5 h-3 rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-3 rounded-full bg-brand-600" style={{ width: moneylessPercent(stats.progress) }} />
        </div>
        <p className="mt-2 text-sm font-medium">{stats.progress}% progress</p>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="My projects" value={stats.totalProjects} />
        <StatCard title="My total tasks" value={stats.assignedTasks} />
        <StatCard title="In progress" value={stats.inProgressTasks} tone="amber" />
        <StatCard title="Completed tasks" value={stats.completedTasks} tone="green" />
        <StatCard title="Overdue tasks" value={stats.overdueTasks} tone="amber" />
        <StatCard title="Due this week" value={stats.tasksDueThisWeek} tone="slate" />
      </div>
      <section className="card">
        <h3 className="font-semibold">Recent activity</h3>
        <div className="mt-3 grid gap-2">
          {(stats.recentActivity || []).length === 0 ? <p className="text-sm text-slate-500">No recent activity yet.</p> : stats.recentActivity.map((item) => <p key={item._id} className="rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800">{item.message}</p>)}
        </div>
      </section>
    </div>
  );
}
