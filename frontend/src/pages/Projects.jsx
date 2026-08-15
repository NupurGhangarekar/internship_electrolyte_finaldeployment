import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/format";

const blank = { name: "", description: "", projectCode: "", assignedInterns: [], status: "Planned", priority: "Medium", startDate: "", dueDate: "", progress: 0 };

export default function Projects({ mode }) {
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/projects", { params: { ...filters, page } }).then((res) => {
      setProjects(res.data);
      setMeta(res.meta);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [page, filters.status, filters.priority]);
  useEffect(() => {
    if (mode === "admin") api.get("/users", { params: { role: "intern", limit: 100 } }).then((res) => setInterns(res.data));
  }, [mode]);

  const toggleIntern = (id) => {
    setForm((current) => ({
      ...current,
      assignedInterns: current.assignedInterns.includes(id) ? current.assignedInterns.filter((item) => item !== id) : [...current.assignedInterns, id]
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editing) await api.put(`/projects/${editing}`, form);
      else await api.post("/projects", form);
      toast.success(editing ? "Project updated" : "Project created");
      setForm(blank);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message || "Project save failed");
    }
  };

  const edit = (project) => {
    setEditing(project._id);
    setForm({
      name: project.name,
      description: project.description || "",
      projectCode: project.projectCode,
      assignedInterns: (project.assignedInterns || []).map((intern) => intern._id || intern),
      status: project.status,
      priority: project.priority,
      startDate: project.startDate?.slice(0, 10) || "",
      dueDate: project.dueDate?.slice(0, 10) || "",
      progress: project.progress || 0
    });
  };

  const archive = async (id) => {
    if (!confirm("Archive this project?")) return;
    await api.delete(`/projects/${id}`);
    toast.success("Project archived");
    load();
  };

  const openDetails = (id) => {
    const base = mode === "admin" ? "/admin" : "/intern";
    navigate(`${base}/projects/${id}`);
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap gap-3">
          <input className="input max-w-sm" placeholder="Search projects..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className="input max-w-xs" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option><option>Planned</option><option>Active</option><option>On Hold</option><option>Completed</option><option>Archived</option>
          </select>
          <select className="input max-w-xs" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
          </select>
          <button className="btn-secondary" onClick={() => { setPage(1); load(); }}>Search</button>
        </div>
      </section>

      {mode === "admin" && (
        <form onSubmit={submit} className="card grid gap-4 lg:grid-cols-2">
          <h2 className="text-lg font-semibold lg:col-span-2">{editing ? "Edit project" : "Create project"}</h2>
          <input className="input" placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Project code" value={form.projectCode} onChange={(e) => setForm({ ...form, projectCode: e.target.value })} required />
          <textarea className="input lg:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Planned</option><option>Active</option><option>On Hold</option><option>Completed</option><option>Archived</option></select>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
          <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <label className="text-sm lg:col-span-2">Progress: {form.progress}%
            <input className="mt-2 w-full" type="range" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
          </label>
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-medium">Assigned interns</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {interns.map((intern) => <label key={intern._id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700"><input type="checkbox" checked={form.assignedInterns.includes(intern._id)} onChange={() => toggleIntern(intern._id)} />{intern.name}</label>)}
            </div>
          </div>
          <button className="btn-primary lg:col-span-2">{editing ? "Update project" : "Create project"}</button>
        </form>
      )}

      <section className="card overflow-hidden">
        {loading ? <Spinner /> : projects.length === 0 ? <EmptyState title="No projects found" /> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((project) => (
              <article key={project._id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-brand-600">{project.projectCode}</p>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{project.description || "No description"}</p>
                  </div>
                  <StatusBadge value={project.status} />
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${project.progress || 0}%` }} /></div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Priority: <b>{project.priority}</b></span>
                  <span>Due: <b>{formatDate(project.dueDate)}</b></span>
                  <span>Interns: <b>{project.assignedInterns?.length || 0}</b></span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => openDetails(project._id)}>View details</button>
                  {mode === "admin" && <button className="btn-secondary" onClick={() => edit(project)}>Edit</button>}
                  {mode === "admin" && <button className="rounded-md px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => archive(project._id)}>Archive</button>}
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </section>

      
    </div>
  );
}
