import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import TaskDetailModal from "../components/TaskDetailModal";
import { toast } from "react-toastify";
import { formatDate } from "../utils/format";

const adminColumns = ["Backlog", "To Do", "In Progress", "Review", "Completed"];
const internColumns = ["Backlog", "To Do", "In Progress", "Review", "Blocked", "Pending", "Submitted", "Completed"];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function KanbanBoard({ mode }) {
  const query = useQuery();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [detailId, setDetailId] = useState(null);

  const projectFilter = query.get("project") || "";
  const openTaskQuery = query.get("openTask") || null;
  const columns = mode === "intern" ? internColumns : adminColumns;

  const load = () => {
    setLoading(true);
    const params = { limit: 200 };
    if (projectFilter) params.project = projectFilter;
    api.get("/tasks", { params }).then((res) => setTasks(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get("/projects", { params: { limit: 200 } }).then((res) => setProjects(res.data)).catch(() => {});
    if (openTaskQuery) setDetailId(openTaskQuery);
  }, [projectFilter, openTaskQuery]);

  const onDragStart = (e, id) => e.dataTransfer.setData("taskId", id);
  const onDrop = async (e, status) => {
    const id = e.dataTransfer.getData("taskId");
    moveTask(id, status);
  };

  const moveTask = async (taskId, status) => {
    const prev = tasks;
    setTasks((current) => current.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      await api.put(`/tasks/${taskId}`, { status });
    } catch (err) {
      setTasks(prev);
      toast.error(err.message || "Move failed");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Kanban Board</h2>
            <p className="mt-1 text-sm text-slate-500">Drag tasks between columns to update status.</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="input" value={projectFilter} onChange={(e) => navigate(`${mode === "admin" ? "/admin" : "/intern"}/board${e.target.value ? `?project=${e.target.value}` : ""}`)}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <button className="btn-secondary" onClick={load}>Refresh</button>
          </div>
        </div>
      </section>

      <section className="overflow-x-auto">
        <div className="flex gap-4 min-w-[900px]">
          {columns.map((col) => (
            <div key={col} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900 min-w-[260px]" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, col)}>
                  <h3 className="mb-3 font-semibold">{col} <span className="text-sm text-slate-500">({tasks.filter((t) => t.status === col).length})</span></h3>
              <div className="space-y-3">
                {tasks.filter((t) => t.status === col).map((task) => (
                  <article key={task._id} draggable onDragStart={(e) => onDragStart(e, task._id)} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-left">
                        <div className="font-semibold"><button className="text-left hover:text-brand-600" onClick={() => setDetailId(task._id)}>{task.title}</button></div>
                        <div className="mt-1 text-xs text-slate-500">{task.project?.name || "No project"} • Due {formatDate(task.dueDate)}</div>
                        <div className="mt-2 flex flex-wrap gap-1 text-xs">{(task.labels || []).map((l) => <span key={l} className="rounded-full bg-slate-100 px-2 py-0.5">{l}</span>)}</div>
                        <div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${task.progress || 0}%` }} /></div>
                      </div>
                      <div className="text-right">
                        <StatusBadge value={task.status} />
                        <div className="mt-2 text-xs">{(task.assignedTo || []).map((a) => a.name).join(", ") || "Unassigned"}</div>
                        <div className="mt-2">
                          <select className="input text-xs" value={task.status} onChange={(e) => moveTask(task._id, e.target.value)}>
                            {columns.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      {detailId && (
        <section className="card fixed inset-0 z-50 m-6 overflow-auto bg-transparent">
          <div className="max-w-4xl mx-auto"><TaskDetailModal taskId={detailId} onClose={() => setDetailId(null)} onUpdated={load} /></div>
        </section>
      )}
    </div>
  );
}
