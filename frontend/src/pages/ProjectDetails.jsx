import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/format";

export default function ProjectDetails({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/projects/${id}`).then((res) => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!data) return <EmptyState title="Project not found" />;

  const { project, tasks = [], activity = [] } = data;

  const openBoard = () => {
    const base = mode === "admin" ? "/admin" : "/intern";
    navigate(`${base}/board?project=${project._id}`);
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-brand-600">{project.projectCode}</p>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{project.description || "No description"}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>Status: <b>{project.status}</b></span>
              <span>Priority: <b>{project.priority}</b></span>
              <span>Start: <b>{project.startDate ? formatDate(project.startDate) : "-"}</b></span>
              <span>Due: <b>{project.dueDate ? formatDate(project.dueDate) : "-"}</b></span>
              <span>Interns: <b>{project.assignedInterns?.length || 0}</b></span>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge value={project.status} />
            <div className="mt-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-3 rounded-full bg-brand-600" style={{ width: `${project.progress || 0}%` }} /></div>
            <p className="mt-2 text-sm font-medium">Progress: {project.progress || 0}%</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-primary" onClick={openBoard}>Open in Board</button>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold">Project tasks</h3>
        <div className="mt-3 grid gap-3">
          {tasks.length === 0 ? <EmptyState title="No tasks in this project" /> : tasks.map((task) => (
            <div key={task._id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <b>{task.title}</b>
                  <p className="mt-1 text-xs text-slate-500">Due {formatDate(task.dueDate)} - Progress {task.progress || 0}%</p>
                </div>
                <div className="text-right">
                  <StatusBadge value={task.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

          <section className="card">
            <h3 className="font-semibold">Recent activity</h3>
            <div className="mt-3 grid gap-2">
              {activity.length === 0 ? <p className="text-sm text-slate-500">No recent activity.</p> : activity.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map((item) => (
                <div key={item._id} className="rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <b>{item.actor?.name || "System"}</b>
                      <div className="mt-1 text-xs text-slate-600">{item.message}</div>
                    </div>
                    <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
    </div>
  );
}
