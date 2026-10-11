import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import TaskDetailModal from "../components/TaskDetailModal";
import { formatDate } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const blankEvent = { title: "", description: "", type: "Meeting", startsAt: "", endsAt: "", meetingUrl: "", project: "", attendees: [] };
const toInputDate = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";

export default function Calendar() {
  const [data, setData] = useState({ tasks: [], projects: [] });
  const [events, setEvents] = useState([]);
  const [interns, setInterns] = useState([]);
  const [form, setForm] = useState(blankEvent);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const admin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const [calendar, customEvents, users] = await Promise.all([
        api.get("/calendar/tasks"), api.get("/calendar/events"),
        admin ? api.get("/users", { params: { role: "intern", limit: 100 } }) : Promise.resolve({ data: [] })
      ]);
      setData(calendar.data); setEvents(customEvents.data); setInterns(users.data || []);
    } catch (error) { toast.error(error.message || "Calendar could not load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [admin]);

  const scheduled = useMemo(() => {
    const inherited = [
      ...data.tasks.flatMap((task) => [task.startDate && { id: `${task._id}-start`, refId: task._id, source: "task", date: task.startDate, kind: "Task start", title: task.title, status: task.status }, task.dueDate && { id: `${task._id}-due`, refId: task._id, source: "task", date: task.dueDate, kind: "Task deadline", title: task.title, status: task.status }].filter(Boolean)),
      ...data.projects.flatMap((project) => [project.startDate && { id: `${project._id}-start`, refId: project._id, source: "project", date: project.startDate, kind: "Project start", title: project.name, status: project.status }, project.dueDate && { id: `${project._id}-due`, refId: project._id, source: "project", date: project.dueDate, kind: "Project deadline", title: project.name, status: project.status }].filter(Boolean))
    ];
    const custom = events.map((event) => ({ id: event._id, source: "event", date: event.startsAt, kind: event.type, title: event.title, description: event.description, meetingUrl: event.meetingUrl, event }));
    return [...custom, ...inherited].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data, events]);

  const toggleAttendee = (id) => setForm((current) => ({ ...current, attendees: current.attendees.includes(id) ? current.attendees.filter((item) => item !== id) : [...current.attendees, id] }));
  const saveEvent = async (event) => { event.preventDefault(); try { if (editing) await api.put(`/calendar/events/${editing}`, form); else await api.post("/calendar/events", form); toast.success(editing ? "Event updated" : "Event scheduled"); setForm(blankEvent); setEditing(null); load(); } catch (error) { toast.error(error.message || "Event could not be saved"); } };
  const editEvent = (event) => { setEditing(event._id); setForm({ title: event.title, description: event.description || "", type: event.type, startsAt: toInputDate(event.startsAt), endsAt: toInputDate(event.endsAt), meetingUrl: event.meetingUrl || "", project: event.project?._id || event.project || "", attendees: (event.attendees || []).map((item) => item._id || item) }); };
  const removeEvent = async (id) => { if (!window.confirm("Delete this calendar event?")) return; try { await api.delete(`/calendar/events/${id}`); toast.success("Event deleted"); load(); } catch (error) { toast.error(error.message || "Event could not be deleted"); } };

  if (loading) return <Spinner />;
  return <div className="space-y-6">
    <section className="card"><h2 className="text-lg font-semibold">Calendar</h2><p className="mt-1 text-sm text-slate-500">Deadlines, meetings, project milestones, and relevant task dates.</p></section>
    {admin && <form onSubmit={saveEvent} className="card"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">{editing ? "Edit event" : "Schedule an event"}</h3>{editing && <button type="button" className="text-sm text-brand-600" onClick={() => { setEditing(null); setForm(blankEvent); }}>Cancel edit</button>}</div><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm font-medium">Title<input className="input mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label><label className="text-sm font-medium">Type<select className="input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["Meeting", "Deadline", "Review", "General"].map((type) => <option key={type}>{type}</option>)}</select></label><label className="text-sm font-medium">Starts<input className="input mt-1" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required /></label><label className="text-sm font-medium">Ends (optional)<input className="input mt-1" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label><label className="text-sm font-medium">Meeting link<input className="input mt-1" type="url" placeholder="https://..." value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} /></label><label className="text-sm font-medium">Project<select className="input mt-1" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}><option value="">No project</option>{data.projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label><label className="text-sm font-medium md:col-span-2">Description<textarea className="input mt-1 min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label></div><div className="mt-4"><p className="text-sm font-medium">Notify interns (optional)</p><div className="mt-2 flex flex-wrap gap-2">{interns.map((intern) => <label key={intern._id} className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><input className="mr-2" type="checkbox" checked={form.attendees.includes(intern._id)} onChange={() => toggleAttendee(intern._id)} />{intern.name}</label>)}</div></div><button className="btn-primary mt-5">{editing ? "Update event" : "Schedule event"}</button></form>}
    {scheduled.length === 0 ? <EmptyState title="No calendar events" /> : <section className="grid gap-3">{scheduled.map((item) => <article key={item.id} className="card flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-brand-600">{item.kind}</p><h3 className="font-semibold">{item.source === "event" ? item.title : <button className="hover:text-brand-600" onClick={() => { if (item.source === "task") setDetailId(item.refId); else navigate(`${user?.role === "admin" ? "/admin" : "/intern"}/projects/${item.refId}`); }}>{item.title}</button>}</h3><p className="text-sm text-slate-500">{formatDate(item.date)}</p>{item.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>}{item.meetingUrl && <a className="mt-2 inline-block text-sm font-medium text-brand-600" href={item.meetingUrl} target="_blank" rel="noreferrer">Join meeting</a>}</div><div className="flex items-center gap-2">{item.status && <StatusBadge value={item.status} />}{admin && item.source === "event" && <><button className="btn-secondary" onClick={() => editEvent(item.event)}>Edit</button><button className="text-sm text-red-600" onClick={() => removeEvent(item.id)}>Delete</button></>}</div></article>)}</section>}
    {detailId && <section className="card fixed inset-0 z-50 m-6 overflow-auto bg-transparent"><div className="mx-auto max-w-4xl"><TaskDetailModal taskId={detailId} onClose={() => setDetailId(null)} onUpdated={() => { setDetailId(null); load(); }} /></div></section>}
  </div>;
}
