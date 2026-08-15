import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { API_URL } from "../api/client";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/format";

const internStatuses = ["Backlog", "To Do", "In Progress", "Review", "Blocked", "Pending", "Submitted"];

export default function InternTasks() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", sort: "dueDate" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ status: "", remarks: "", progress: 0, actualHours: 0 });
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/tasks", { params: { ...filters, page } }).then((res) => {
      setTasks(res.data);
      setMeta(res.meta);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [page, filters.status, filters.priority, filters.sort]);

  const openEdit = (task) => {
    setEditingId(task._id);
    setEditData({ status: task.status, remarks: task.remarks || "", progress: task.progress || 0, actualHours: task.actualHours || 0 });
  };

  const saveUpdate = async () => {
    try {
      await api.put(`/tasks/${editingId}`, editData);
      toast.success("Task updated");
      setEditingId(null);
      load();
    } catch (error) {
      toast.error(error.message || "Update failed");
    }
  };

  const openDetail = async (id) => {
    const res = await api.get(`/tasks/${id}`);
    setDetail(res.data);
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold">My Tasks</h2>
        <p className="mt-1 text-sm text-slate-500">View assigned work, update progress, and collaborate with your admin.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input className="input max-w-sm" placeholder="Search tasks..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className="input max-w-xs" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{internStatuses.concat("Completed").map((s) => <option key={s}>{s}</option>)}</select>
          <select className="input max-w-xs" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
          <button className="btn-secondary" onClick={() => { setPage(1); load(); }}>Search</button>
        </div>
      </section>

      <section className="card overflow-hidden">
        {loading ? <Spinner /> : tasks.length === 0 ? <EmptyState title="No tasks assigned" message="You don't have any tasks yet. Check back later." /> : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task._id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-brand-600">{task.project?.name || "No project"}</p>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <span className="text-slate-500">Priority: <b>{task.priority}</b></span>
                      <span className="text-slate-500">Due: <b>{formatDate(task.dueDate)}</b></span>
                      <span className="text-slate-500">Progress: <b>{task.progress || 0}%</b></span>
                    </div>
                  </div>
                  <StatusBadge value={task.status} />
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${task.progress || 0}%` }} /></div>

                {editingId === task._id ? (
                  <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 dark:border-slate-700 md:grid-cols-2">
                    <select className="input" value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>{internStatuses.map((s) => <option key={s}>{s}</option>)}</select>
                    <input className="input" type="number" min="0" placeholder="Actual hours" value={editData.actualHours} onChange={(e) => setEditData({ ...editData, actualHours: Number(e.target.value) })} />
                    <label className="text-sm md:col-span-2">Progress: {editData.progress}%<input className="mt-2 w-full" type="range" min="0" max="100" value={editData.progress} onChange={(e) => setEditData({ ...editData, progress: Number(e.target.value) })} /></label>
                    <textarea className="input md:col-span-2" placeholder="Remarks" value={editData.remarks} onChange={(e) => setEditData({ ...editData, remarks: e.target.value })} rows={2} />
                    <button className="btn-primary" onClick={saveUpdate}>Save changes</button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="btn-secondary" onClick={() => openEdit(task)}>Update task</button>
                    <button className="btn-secondary" onClick={() => openDetail(task._id)}>Details</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </section>
      {detail && <InternTaskDetail detail={detail} onClose={() => setDetail(null)} onRefresh={() => openDetail(detail.task._id)} />}
    </div>
  );
}

function InternTaskDetail({ detail, onClose, onRefresh }) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const task = detail.task;

  const addComment = async () => {
    if (!comment.trim()) return;
    await api.post(`/tasks/${task._id}/comments`, { content: comment });
    setComment("");
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
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{task.title}</h2><p className="text-sm text-slate-500">{task.description}</p></div><button className="text-sm text-slate-500" onClick={onClose}>Close</button></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div><h3 className="font-semibold">Subtasks</h3><div className="mt-3 grid gap-2">{detail.subtasks.length === 0 ? <p className="text-sm text-slate-500">No subtasks.</p> : detail.subtasks.map((item) => <div key={item._id} className="rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700"><div className="flex justify-between gap-2"><span>{item.title}</span><StatusBadge value={item.status} /></div></div>)}</div></div>
        <div><h3 className="font-semibold">Comments</h3><div className="mt-3 max-h-64 space-y-2 overflow-auto">{detail.comments.map((item) => <div key={item._id} className="rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800"><b>{item.author?.name}</b><p>{item.content}</p><p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p></div>)}</div><textarea className="input mt-3" placeholder="Add comment" value={comment} onChange={(e) => setComment(e.target.value)} /><button className="btn-secondary mt-2" onClick={addComment}>Comment</button></div>
        <div><h3 className="font-semibold">Attachments & Activity</h3><div className="mt-3 grid gap-2">{detail.attachments.map((item) => <a key={item._id} className="text-sm text-brand-600" href={`${API_URL}/tasks/${task._id}/attachments/${item._id}`}>{item.originalName}</a>)}</div><div className="mt-3 flex gap-2"><input className="input" type="file" onChange={(e) => setFile(e.target.files[0])} /><button className="btn-secondary" onClick={upload}>Upload</button></div><div className="mt-4 max-h-64 space-y-2 overflow-auto">{detail.activity.map((item) => <p key={item._id} className="rounded-md bg-slate-50 p-2 text-xs dark:bg-slate-800">{item.message}</p>)}</div></div>
      </div>
    </section>
  );
}
