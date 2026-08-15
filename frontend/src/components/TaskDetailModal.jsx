import React, { useEffect, useState } from "react";
import api, { API_URL } from "../api/client";
import Spinner from "./Spinner";
import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/format";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function TaskDetailModal({ taskId, onClose, onUpdated }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [file, setFile] = useState(null);
  const [editData, setEditData] = useState(null);
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [saving, setSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${taskId}`);
      setDetail(res.data);
    } catch (err) {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [taskId]);

  useEffect(() => {
    if (detail?.task) setEditData({ status: detail.task.status, priority: detail.task.priority, dueDate: detail.task.dueDate?.slice(0, 10) || "", progress: detail.task.progress || 0 });
  }, [detail]);

  const addComment = async () => {
    if (!comment.trim()) return;
    // optimistic: add temp comment locally
    const tempId = `temp-${Date.now()}`;
    const tempComment = { _id: tempId, content: comment, author: { name: user?.name, _id: user?.id }, createdAt: new Date().toISOString() };
    setDetail((d) => ({ ...d, comments: [...(d.comments || []), tempComment] }));
    setCommentSaving(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: comment });
      setComment("");
      await load();
      onUpdated?.();
      toast.success("Comment added");
    } catch (err) {
      // remove temp comment
      setDetail((d) => ({ ...d, comments: (d.comments || []).filter((c) => c._id !== tempId) }));
      toast.error(err.message || "Comment failed");
    } finally {
      setCommentSaving(false);
    }
  };

  const addSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    try {
      await api.post(`/tasks/${taskId}/subtasks`, { title: subtaskTitle });
      setSubtaskTitle("");
      await load();
      onUpdated?.();
      toast.success("Subtask created");
    } catch (err) {
      toast.error(err.message || "Subtask create failed");
    }
  };

  const toggleSubtask = async (subtask) => {
    const newStatus = subtask.status === "Completed" ? "To Do" : "Completed";
    // Optimistic update
    const previous = detail;
    try {
      setDetail((d) => ({
        ...d,
        subtasks: d.subtasks.map((s) => (s._id === subtask._id ? { ...s, status: newStatus } : s))
      }));
      await api.put(`/tasks/${taskId}/subtasks/${subtask._id}`, { status: newStatus });
      await load();
      onUpdated?.();
      toast.success("Subtask updated");
    } catch (err) {
      setDetail(previous);
      toast.error(err.message || "Update failed");
    }
  };

  const deleteSubtask = async (subtask) => {
    if (!confirm("Delete this subtask?")) return;
    // Optimistic remove
    const previous = detail;
    try {
      setDetail((d) => ({ ...d, subtasks: d.subtasks.filter((s) => s._id !== subtask._id) }));
      await api.delete(`/tasks/${taskId}/subtasks/${subtask._id}`);
      await load();
      onUpdated?.();
      toast.success("Subtask deleted");
    } catch (err) {
      setDetail(previous);
      toast.error(err.message || "Delete failed");
    }
  };

  const upload = async () => {
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    await api.post(`/tasks/${taskId}/attachments`, data);
    setFile(null);
    await load();
    onUpdated?.();
  };

  const saveTask = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      await api.put(`/tasks/${taskId}`, { ...editData, progress: Number(editData.progress) });
      await load();
      onUpdated?.();
      toast.success("Task updated");
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteComment = async (c) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.delete(`/comments/${c._id}`);
      await load();
      onUpdated?.();
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  const startEditComment = (c) => {
    setEditingCommentId(c._id);
    setEditingCommentText(c.content);
  };

  const saveCommentEdit = async () => {
    if (!editingCommentId) return;
    // optimistic update
    const prev = detail;
    try {
      setDetail((d) => ({ ...d, comments: d.comments.map((c) => (c._id === editingCommentId ? { ...c, content: editingCommentText } : c)) }));
      await api.put(`/comments/${editingCommentId}`, { content: editingCommentText });
      setEditingCommentId(null);
      setEditingCommentText("");
      await load();
      onUpdated?.();
      toast.success("Comment updated");
    } catch (err) {
      setDetail(prev);
      toast.error(err.message || "Update failed");
    }
  };

  if (loading) return <div className="card"><Spinner /></div>;
  if (!detail) return <div className="card"><p className="text-sm text-slate-500">Task not found.</p></div>;

  const { task, subtasks = [], comments = [], attachments = [], activity = [] } = detail;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{task.title}</h2>
          <p className="text-sm text-slate-500">{task.description}</p>
        </div>
        <div className="text-right">
          <StatusBadge value={task.status} />
          <p className="mt-2 text-sm">Due {formatDate(task.dueDate)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <h3 className="font-semibold">Edit task</h3>
          {editData ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <select className="input" value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                <option>Backlog</option>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Completed</option>
                <option>Blocked</option>
                <option>Pending</option>
                <option>Submitted</option>
              </select>
              {user?.role === "admin" ? (
                <>
                  <select className="input" value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
                  <input className="input" type="date" value={editData.dueDate} onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })} />
                </>
              ) : (
                <></>
              )}
              <label className="text-sm">Progress: {editData.progress}%<input className="mt-2 w-full" type="range" min="0" max="100" value={editData.progress} onChange={(e) => setEditData({ ...editData, progress: Number(e.target.value) })} /></label>
              <div className="sm:col-span-4 mt-2 flex gap-2">
                <button className="btn-primary" onClick={saveTask} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <h3 className="font-semibold">Subtasks</h3>
          <p className="mt-1 text-sm text-slate-500">{subtasks.filter((s) => s.status === "Completed").length}/{subtasks.length} completed</p>
          <div className="mt-3 grid gap-2">
            {subtasks.map((s) => (
              <div key={s._id} className="rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-slate-500">{s.assignedTo?.map?.((a) => a.name).join(", ")}</div>
                </div>
                <div className="text-right flex gap-2 items-center">
                  <button className="text-sm text-brand-600" onClick={() => toggleSubtask(s)}>{s.status === "Completed" ? "Uncomplete" : "Complete"}</button>
                  <button className="text-sm text-red-600" onClick={() => deleteSubtask(s)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className="input" placeholder="New subtask" value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} />
            <button className="btn-secondary" onClick={addSubtask}>Add</button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Comments</h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-auto">
            {comments.map((c) => (
              <div key={c._id} className="rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <b>{c.author?.name}</b>
                    <p className="text-xs text-slate-500">{formatDate(c.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    {(user?.id === c.author?._id || user?.role === "admin") && (
                      <>
                        <button className="text-xs text-brand-600 mr-2" onClick={() => startEditComment(c)}>Edit</button>
                        <button className="text-xs text-red-600" onClick={() => deleteComment(c)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
                {editingCommentId === c._id ? (
                  <div className="mt-2">
                    <textarea className="input" value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} />
                    <div className="mt-2 flex gap-2"><button className="btn-secondary" onClick={saveCommentEdit}>Save</button><button className="btn-secondary" onClick={() => setEditingCommentId(null)}>Cancel</button></div>
                  </div>
                ) : (
                  <p className="mt-2">{c.content}</p>
                )}
              </div>
            ))}
          </div>
          <textarea className="input mt-3" placeholder="Add comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn-secondary mt-2" onClick={addComment}>Comment</button>
        </div>

        <div>
          <h3 className="font-semibold">Attachments & Activity</h3>
          <div className="mt-3 grid gap-2">
            {attachments.map((a) => <a key={a._id} className="text-sm text-brand-600" href={`${API_URL}/tasks/${task._id}/attachments/${a._id}`} target="_blank" rel="noreferrer">{a.originalName}</a>)}
          </div>
          <div className="mt-3 flex gap-2">
            <input className="input" type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button className="btn-secondary" onClick={upload}>Upload</button>
          </div>
          <div className="mt-4 max-h-64 space-y-2 overflow-auto">
            {activity
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((it) => (
                <div key={it._id} className="rounded-md bg-slate-50 p-2 text-xs dark:bg-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <b>{it.actor?.name || "System"}</b>
                      <div className="mt-1 text-xs text-slate-600">{it.message}</div>
                    </div>
                    <div className="text-xs text-slate-400">{formatDate(it.createdAt)}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
