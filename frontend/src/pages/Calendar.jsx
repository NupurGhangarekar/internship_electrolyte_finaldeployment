import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/format";
import TaskDetailModal from "../components/TaskDetailModal";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Calendar() {
  const [data, setData] = useState({ tasks: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/calendar/tasks").then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  const events = useMemo(() => {
    const taskEvents = data.tasks.flatMap((task) => [
      task.startDate ? { id: `${task._id}-start`, refId: task._id, type: "task", date: task.startDate, kind: "Task start", title: task.title, status: task.status, priority: task.priority } : null,
      task.dueDate ? { id: `${task._id}-due`, refId: task._id, type: "task", date: task.dueDate, kind: "Task due", title: task.title, status: task.status, priority: task.priority } : null
    ].filter(Boolean));
    const projectEvents = data.projects.flatMap((project) => [
      project.startDate ? { id: `${project._id}-start`, refId: project._id, type: "project", date: project.startDate, kind: "Project start", title: project.name, status: project.status } : null,
      project.dueDate ? { id: `${project._id}-due`, refId: project._id, type: "project", date: project.dueDate, kind: "Project due", title: project.name, status: project.status } : null
    ].filter(Boolean));
    return [...taskEvents, ...projectEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <p className="mt-1 text-sm text-slate-500">Task and project start dates, due dates, and upcoming deadlines.</p>
      </section>
      {events.length === 0 ? <EmptyState title="No calendar events" /> : (
        <section className="grid gap-3">
          {events.map((event) => (
            <article key={event.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-brand-600">{event.kind}</p>
                <h3 className="font-semibold"><button className="hover:text-brand-600" onClick={() => {
                  if (event.type === "task") setDetailId(event.refId);
                  if (event.type === "project") navigate(`${user?.role === "admin" ? "/admin" : "/intern"}/projects/${event.refId}`);
                }}>{event.title}</button></h3>
                <p className="text-sm text-slate-500">{formatDate(event.date)}{event.priority ? ` - ${event.priority}` : ""}</p>
              </div>
              <StatusBadge value={event.status} />
            </article>
          ))}
        </section>
      )}
      {detailId && <section className="card fixed inset-0 z-50 m-6 overflow-auto bg-transparent"><div className="max-w-4xl mx-auto"><TaskDetailModal taskId={detailId} onClose={() => setDetailId(null)} onUpdated={() => { setDetailId(null); load(); }} /></div></section>}
    </div>
  );
}
