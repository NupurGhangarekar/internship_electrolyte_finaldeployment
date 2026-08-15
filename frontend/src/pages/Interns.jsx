import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import Spinner from "../components/Spinner";
import { formatDate } from "../utils/format";

const blank = { name: "", email: "", password: "", department: "", joiningDate: "", role: "intern" };

export default function Interns() {
  const [interns, setInterns] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/users", { params: { role: "intern", search, page, includeWorkload: true } }).then((res) => {
      setInterns(res.data);
      setMeta(res.meta);
    }).finally(() => setLoading(false));
  };
  useEffect(load, [page]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, password: form.password || undefined };
      if (editing) await api.put(`/users/${editing}`, payload);
      else await api.post("/users", payload);
      toast.success(editing ? "Intern updated" : "Intern created");
      setForm(blank);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message || "Save failed");
    }
  };

  const edit = (intern) => {
    setEditing(intern._id);
    setForm({ name: intern.name, email: intern.email, password: "", department: intern.department || "", joiningDate: intern.joiningDate?.slice(0, 10) || "", role: "intern" });
  };

  const remove = async (id) => {
    if (!confirm("Delete this intern and related records?")) return;
    await api.delete(`/users/${id}`);
    toast.success("Intern deleted");
    load();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="card h-fit">
        <h2 className="text-lg font-semibold">{editing ? "Edit intern" : "Create intern"}</h2>
        {["name", "email", "password", "department"].map((field) => (
          <label key={field} className="mt-4 block text-sm font-medium capitalize">{field}
            <input className="input mt-1" type={field === "password" ? "password" : "text"} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={!editing && field !== "department"} />
          </label>
        ))}
        <label className="mt-4 block text-sm font-medium">Joining date
          <input className="input mt-1" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
        </label>
        <button className="btn-primary mt-5 w-full">{editing ? "Update intern" : "Create intern"}</button>
      </form>
      <section className="card overflow-hidden">
        <div className="mb-4 flex flex-wrap gap-3">
          <input className="input max-w-sm" placeholder="Search interns..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-secondary" onClick={() => { setPage(1); load(); }}>Search</button>
        </div>
        {loading ? <Spinner /> : interns.length === 0 ? <EmptyState title="No interns found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-th">Name</th><th className="table-th">Department</th><th className="table-th">Workload</th><th className="table-th">Joining</th><th className="table-th">Actions</th></tr></thead>
              <tbody>{interns.map((intern) => <tr key={intern._id} className="border-t border-slate-100 dark:border-slate-800"><td className="table-td"><b>{intern.name}</b><br /><span className="text-xs text-slate-500">{intern.email}</span></td><td className="table-td">{intern.department || "-"}</td><td className="table-td"><div className="text-xs text-slate-500">Projects: <b>{intern.workload?.assignedProjects || 0}</b><br />Tasks: <b>{intern.workload?.assignedTasks || 0}</b> - Overdue: <b>{intern.workload?.overdueTasks || 0}</b></div></td><td className="table-td">{formatDate(intern.joiningDate)}</td><td className="table-td"><button className="mr-2 text-brand-600" onClick={() => edit(intern)}>Edit</button><button className="text-red-600" onClick={() => remove(intern._id)}>Delete</button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={setPage} />
      </section>
    </div>
  );
}
