import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/format";

const blank = { title: "", description: "", assignedTo: "", priority: "Medium", dueDate: "", status: "Pending" };

export default function Tasks({ mode }) {
  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ status: "", priority: "", sort: "-createdAt" });
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/tasks", { params: { ...filters, page } }).then((res) => {
      setTasks(res.data);
      setMeta(res.meta);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [page, filters.status, filters.priority, filters.sort]);
  useEffect(() => {
    if (mode === "admin") api.get("/users", { params: { role: "intern", limit: 100 } }).then((res) => setInterns(res.data));
  }, [mode]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editing) await api.put(`/tasks/${editing}`, form);
      else await api.post("/tasks", form);
      toast.success(editing ? "Task updated" : "Task assigned");
      setForm(blank);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message || "Task save failed");
    }
  };

  const edit = (task) => {
    setEditing(task._id);
    setForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || task.assignedTo,
      priority: task.priority,
      dueDate: task.dueDate?.slice(0, 10),
      status: task.status
    });
  };

  const updateInternTask = async (task, values) => {
    try {
      await api.put(`/tasks/${task._id}`, values);
      toast.success("Task updated");
      load();
    } catch (error) {
      toast.error(error.message || "Update failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${id}`);
    toast.success("Task deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap gap-3">
          <select className="input max-w-xs" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option><option>Pending</option><option>In Progress</option><option>Submitted</option><option>Completed</option>
          </select>
          <select className="input max-w-xs" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
          </select>
          <select className="input max-w-xs" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="-createdAt">Newest first</option><option value="dueDate">Due date</option><option value="-priority">Priority</option>
          </select>
        </div>
      </section>

      {mode === "admin" && (
        <form onSubmit={submit} className="card grid gap-4 lg:grid-cols-2">
          <h2 className="text-lg font-semibold lg:col-span-2">{editing ? "Edit task" : "Create task"}</h2>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required>
            <option value="">Assign to intern</option>{interns.map((i) => <option key={i._id} value={i._id}>{i.name} - {i.department}</option>)}
          </select>
          <textarea className="input lg:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
          <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Pending</option><option>In Progress</option><option>Submitted</option><option>Completed</option></select>
          <button className="btn-primary lg:col-span-2">{editing ? "Update task" : "Assign task"}</button>
        </form>
      )}

      <section className="card overflow-hidden">
        {loading ? <Spinner /> : tasks.length === 0 ? <EmptyState title="No tasks found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-th">Task</th><th className="table-th">Intern</th><th className="table-th">Due</th><th className="table-th">Status</th><th className="table-th">Actions</th></tr></thead>
              <tbody>{tasks.map((task) => (
                <tr key={task._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="table-td"><b>{task.title}</b><p className="max-w-md text-xs text-slate-500">{task.description}</p><p className="mt-1 text-xs">Priority: {task.priority}</p>{task.remarks && <p className="mt-1 text-xs text-slate-500">Remarks: {task.remarks}</p>}</td>
                  <td className="table-td">{task.assignedTo?.name || "-"}</td>
                  <td className="table-td">{formatDate(task.dueDate)}</td>
                  <td className="table-td"><StatusBadge value={task.status} /></td>
                  <td className="table-td">
                    {mode === "admin" ? <><button className="mr-2 text-brand-600" onClick={() => edit(task)}>Edit</button><button className="text-red-600" onClick={() => remove(task._id)}>Delete</button></> : (
                      <InternTaskActions task={task} onSave={updateInternTask} />
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </section>
    </div>
  );
}

function InternTaskActions({ task, onSave }) {
  const [status, setStatus] = useState(task.status === "Completed" ? "Submitted" : task.status);
  const [remarks, setRemarks] = useState(task.remarks || "");
  return (
    <div className="grid min-w-56 gap-2">
      <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option>Pending</option><option>In Progress</option><option>Submitted</option>
      </select>
      <input className="input" placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <button className="btn-secondary" onClick={() => onSave(task, { status, remarks })}>Save</button>
    </div>
  );
}
