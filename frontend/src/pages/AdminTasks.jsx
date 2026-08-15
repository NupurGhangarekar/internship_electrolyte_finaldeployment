import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { API_URL } from "../api/client";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/format";

const statuses = ["Backlog", "To Do", "In Progress", "Review", "Completed"];
const blank = { title: "", description: "", project: "", assignedTo: [], priority: "Medium", startDate: "", dueDate: "", status: "To Do", progress: 0, labels: "", estimatedHours: 0 };

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", project: "", assignedTo: "", sort: "-createdAt" });
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/tasks", { params: { ...filters, page, limit: 50 } }).then((res) => {
      setTasks(res.data);
      setMeta(res.meta);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [page, filters.status, filters.priority, filters.project, filters.assignedTo, filters.sort]);
  useEffect(() => {
    api.get("/users", { params: { role: "intern", limit: 100 } }).then((res) => setInterns(res.data));
    api.get("/projects", { params: { limit: 100 } }).then((res) => setProjects(res.data));
  }, []);

  const payload = () => ({
    ...form,
    assignedTo: form.assignedTo,
    labels: form.labels.split(",").map((label) => label.trim()).filter(Boolean),
    estimatedHours: Number(form.estimatedHours || 0),
    progress: Number(form.progress || 0)
  });

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editing) await api.put(`/tasks/${editing}`, payload());
      else await api.post("/tasks", payload());
      toast.success(editing ? "Task updated" : "Task assigned");
      setForm(blank);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message || "Task save failed");
    }
  };

  const toggleIntern = (id) => {
    setForm((current) => ({ ...current, assignedTo: current.assignedTo.includes(id) ? current.assignedTo.filter((item) => item !== id) : [...current.assignedTo, id] }));
  };

  const edit = (task) => {
    setEditing(task._id);
    setForm({
      title: task.title,
      description: task.description,
      project: task.project?._id || task.project || "",
      assignedTo: (task.assignedTo || []).map((intern) => intern._id || intern),
      priority: task.priority,
      startDate: task.startDate?.slice(0, 10) || "",
      dueDate: task.dueDate?.slice(0, 10),
      status: task.status,
      progress: task.progress || 0,
      labels: (task.labels || []).join(", "),
      estimatedHours: task.estimatedHours || 0
    });
  };

  const remove = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${id}`);
    toast.success("Task deleted");
    load();
  };

  const moveTask = async (taskId, status) => {
    const task = tasks.find((item) => item._id === taskId);
    if (!task || task.status === status) return;
    setTasks((current) => current.map((item) => item._id === taskId ? { ...item, status } : item));
    try {
      await api.put(`/tasks/${taskId}`, { status });
      toast.success("Task moved");
    } catch (error) {
      toast.error(error.message || "Move failed");
      load();
    }
  };

  const openDetail = async (id) => {
    const res = await api.get(`/tasks/${id}`);
    setDetail(res.data);
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap gap-3">
          <input className="input max-w-sm" placeholder="Search tasks..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className="input max-w-xs" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{statuses.concat("Blocked").map((s) => <option key={s}>{s}</option>)}</select>
          <select className="input max-w-xs" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
          <select className="input max-w-xs" value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}><option value="">All projects</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>
          <select className="input max-w-xs" value={filters.assignedTo} onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}><option value="">All interns</option>{interns.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}</select>
          <button className="btn-secondary" onClick={() => { setPage(1); load(); }}>Search</button>
        </div>
      </section>

      <form onSubmit={submit} className="card grid gap-4 lg:grid-cols-2">
        <h2 className="text-lg font-semibold lg:col-span-2">{editing ? "Edit task" : "Create task"}</h2>
        <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <select className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}><option value="">No project</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>
        <textarea className="input lg:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.concat("Blocked").map((s) => <option key={s}>{s}</option>)}</select>
        <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
        <input className="input" placeholder="Labels, comma separated" value={form.labels} onChange={(e) => setForm({ ...form, labels: e.target.value })} />
        <input className="input" type="number" min="0" placeholder="Estimated hours" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} />
        <label className="text-sm lg:col-span-2">Progress: {form.progress}%<input className="mt-2 w-full" type="range" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} /></label>
        <div className="lg:col-span-2">
          <p className="mb-2 text-sm font-medium">Assigned interns</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{interns.map((intern) => <label key={intern._id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700"><input type="checkbox" checked={form.assignedTo.includes(intern._id)} onChange={() => toggleIntern(intern._id)} />{intern.name}</label>)}</div>
        </div>
        <button className="btn-primary lg:col-span-2">{editing ? "Update task" : "Assign task"}</button>
      </form>

      <section className="grid gap-4 xl:grid-cols-5">
        {statuses.map((status) => (
          <div key={status} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" onDragOver={(e) => e.preventDefault()} onDrop={(e) => moveTask(e.dataTransfer.getData("taskId"), status)}>
            <h3 className="mb-3 font-semibold">{status}</h3>
            <div className="space-y-3">
              {tasks.filter((task) => task.status === status).map((task) => <TaskCard key={task._id} task={task} onEdit={edit} onRemove={remove} onOpen={openDetail} />)}
            </div>
          </div>
        ))}
      </section>

      <section className="card overflow-hidden">
        {loading ? <Spinner /> : tasks.length === 0 ? <EmptyState title="No tasks found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-th">Task</th><th className="table-th">Project</th><th className="table-th">Interns</th><th className="table-th">Due</th><th className="table-th">Status</th><th className="table-th">Actions</th></tr></thead>
              <tbody>{tasks.map((task) => <tr key={task._id} className="border-t border-slate-100 dark:border-slate-800"><td className="table-td"><b>{task.title}</b><p className="text-xs text-slate-500">{task.labels?.join(", ")}</p></td><td className="table-td">{task.project?.name || "-"}</td><td className="table-td">{(task.assignedTo || []).map((i) => i.name).join(", ")}</td><td className="table-td">{formatDate(task.dueDate)}</td><td className="table-td"><StatusBadge value={task.status} /></td><td className="table-td"><button className="mr-2 text-brand-600" onClick={() => openDetail(task._id)}>Details</button><button className="mr-2 text-brand-600" onClick={() => edit(task)}>Edit</button><button className="text-red-600" onClick={() => remove(task._id)}>Delete</button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </section>
      {detail && <TaskDetailPanel detail={detail} onClose={() => setDetail(null)} onRefresh={() => openDetail(detail.task._id)} />}
    </div>
  );
}

function TaskCard({ task, onEdit, onRemove, onOpen }) {
  return (
    <article draggable onDragStart={(e) => e.dataTransfer.setData("taskId", task._id)} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <button className="text-left font-semibold hover:text-brand-600" onClick={() => onOpen(task._id)}>{task.title}</button>
      <p className="mt-1 text-xs text-slate-500">{task.project?.name || "No project"} - Due {formatDate(task.dueDate)}</p>
      <div className="mt-2 flex flex-wrap gap-1">{(task.labels || []).map((label) => <span key={label} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{label}</span>)}</div>
      <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${task.progress || 0}%` }} /></div>
      <div className="mt-3 flex items-center justify-between text-xs"><span>{(task.assignedTo || []).map((i) => i.name).join(", ") || "Unassigned"}</span><b>{task.priority}</b></div>
      <div className="mt-3 flex gap-2"><button className="text-xs text-brand-600" onClick={() => onEdit(task)}>Edit</button><button className="text-xs text-red-600" onClick={() => onRemove(task._id)}>Delete</button></div>
    </article>
  );
}

function TaskDetailPanel({ detail, onClose, onRefresh }) {
  const [comment, setComment] = useState("");
  const [subtask, setSubtask] = useState("");
  const [file, setFile] = useState(null);
  const task = detail.task;

  const addComment = async () => {
    if (!comment.trim()) return;
    await api.post(`/tasks/${task._id}/comments`, { content: comment });
    setComment("");
    onRefresh();
  };
  const addSubtask = async () => {
    if (!subtask.trim()) return;
    await api.post(`/tasks/${task._id}/subtasks`, { title: subtask });
    setSubtask("");
    onRefresh();
  };
  const upload = async () => {
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    await api.post(`/tasks/${task._id}/attachments`, data);
    setFile(null);
    onRefresh();
  };

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold">{task.title}</h2><p className="text-sm text-slate-500">{task.description}</p></div>
        <button className="text-sm text-slate-500" onClick={onClose}>Close</button>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div><h3 className="font-semibold">Subtasks</h3><p className="mt-1 text-sm text-slate-500">{detail.subtasks.filter((item) => item.status === "Completed").length}/{detail.subtasks.length} completed</p><div className="mt-3 grid gap-2">{detail.subtasks.map((item) => <div key={item._id} className="rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700"><div className="flex justify-between gap-2"><span>{item.title}</span><StatusBadge value={item.status} /></div></div>)}</div><div className="mt-3 flex gap-2"><input className="input" placeholder="New subtask" value={subtask} onChange={(e) => setSubtask(e.target.value)} /><button className="btn-secondary" onClick={addSubtask}>Add</button></div></div>
        <div><h3 className="font-semibold">Comments</h3><div className="mt-3 max-h-64 space-y-2 overflow-auto">{detail.comments.map((item) => <div key={item._id} className="rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800"><b>{item.author?.name}</b><p>{item.content}</p><p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p></div>)}</div><textarea className="input mt-3" placeholder="Add comment" value={comment} onChange={(e) => setComment(e.target.value)} /><button className="btn-secondary mt-2" onClick={addComment}>Comment</button></div>
        <div><h3 className="font-semibold">Attachments & Activity</h3><div className="mt-3 grid gap-2">{detail.attachments.map((item) => <a key={item._id} className="text-sm text-brand-600" href={`${API_URL}/tasks/${task._id}/attachments/${item._id}`}>{item.originalName}</a>)}</div><div className="mt-3 flex gap-2"><input className="input" type="file" onChange={(e) => setFile(e.target.files[0])} /><button className="btn-secondary" onClick={upload}>Upload</button></div><div className="mt-4 max-h-64 space-y-2 overflow-auto">{detail.activity.map((item) => <p key={item._id} className="rounded-md bg-slate-50 p-2 text-xs dark:bg-slate-800">{item.message}</p>)}</div></div>
      </div>
    </section>
  );
}
