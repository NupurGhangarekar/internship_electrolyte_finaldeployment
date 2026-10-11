import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/client";

const emptyForm = { name: "", email: "", projectName: "", joiningDate: "", internshipDuration: "", mentorName: "", collegeName: "", branchName: "" };
const emptyTemplate = {
  companyName: "Electrolyte Solutions",
  subject: "Appointment as Software Development Intern",
  intro: "We are pleased to appoint you as a Software Development Intern at Electrolyte Solutions.",
  body: "During your internship, you will contribute to the assigned project while building practical experience in web application development, database management, and dashboard analytics.",
  closing: "We look forward to your contribution and wish you a successful learning experience with us.",
  signatoryName: "Harish Yadav",
  signatoryTitle: "Chief Executive Officer"
};

export default function Onboarding() {
  const [form, setForm] = useState(emptyForm);
  const [template, setTemplate] = useState(emptyTemplate);
  const [preview, setPreview] = useState(null);
  const [existingInterns, setExistingInterns] = useState([]);
  const [letterForm, setLetterForm] = useState({ internId: "", type: "Letter of Recommendation" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/users", { params: { role: "intern", limit: 100 } }).then((res) => setExistingInterns(res.data)).catch(() => {}); }, []);

  const submitManual = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/onboarding/manual", { ...form, template });
      toast.success(res.message || "Intern onboarded and offer letter generated");
      setForm(emptyForm);
    } catch (error) { toast.error(error.message || "Onboarding failed"); }
    finally { setLoading(false); }
  };

  const previewFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData(); body.append("file", file);
    setLoading(true);
    try { const res = await api.post("/onboarding/preview", body); setPreview(res.data); toast.success("Spreadsheet validated"); }
    catch (error) { toast.error(error.message || "Spreadsheet preview failed"); }
    finally { setLoading(false); event.target.value = ""; }
  };

  const confirmBulk = async () => {
    if (!preview?.validRows?.length) return;
    setLoading(true);
    try {
      const res = await api.post("/onboarding/bulk", { rows: preview.validRows.map((item) => item.row), template });
      const created = res.data.filter((item) => item.status === "created").length;
      toast.success(`${created} intern account${created === 1 ? "" : "s"} created`);
      setPreview(null);
    } catch (error) { toast.error(error.message || "Bulk onboarding failed"); }
    finally { setLoading(false); }
  };

  const sendExistingLetter = async (event) => {
    event.preventDefault();
    if (!letterForm.internId) return toast.error("Choose an intern");
    setLoading(true);
    try { const res = await api.post(`/onboarding/letters/${letterForm.internId}`, { type: letterForm.type, template }); toast.success(res.message || "Letter generated and queued for email"); }
    catch (error) { toast.error(error.message || "Letter could not be generated"); }
    finally { setLoading(false); }
  };

  return <div className="space-y-6">
    <section className="card"><h2 className="text-lg font-semibold">Intern onboarding</h2><p className="mt-1 text-sm text-slate-500">Create secure intern accounts, generate offer letters, and send onboarding emails.</p></section>
    <section className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={submitManual} className="card"><h3 className="text-lg font-semibold">Add one intern</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries({ name: "Intern name", email: "Intern email", projectName: "Project name", joiningDate: "Joining date", internshipDuration: "Internship duration", mentorName: "Mentor name", collegeName: "College name", branchName: "Branch name" }).map(([field, label]) => <label key={field} className="text-sm font-medium">{label}<input className="input mt-1" type={field === "joiningDate" ? "date" : field === "email" ? "email" : "text"} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required /></label>)}</div><button className="btn-primary mt-5" disabled={loading}>{loading ? "Working..." : "Create account and send offer"}</button></form>
      <section className="card"><h3 className="text-lg font-semibold">Bulk onboarding from Excel</h3><p className="mt-2 text-sm text-slate-500">Upload .xlsx, .xls, or .csv with: Intern name, Intern email, Project name, Joining date, Duration of internship, Mentor name, College name, and Branch name.</p><label className="btn-secondary mt-5 inline-block cursor-pointer">Choose spreadsheet<input className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={previewFile} /></label>{preview && <div className="mt-5 space-y-3"><p className="text-sm text-green-700">{preview.validRows.length} valid row(s)</p>{preview.invalidRows.length > 0 && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{preview.invalidRows.length} row(s) need correction. They will not be created.</div>}<button className="btn-primary" onClick={confirmBulk} disabled={loading || !preview.validRows.length}>Create valid accounts and send offers</button></div>}</section>
    </section>
    <section className="card"><h3 className="text-lg font-semibold">Offer-letter settings</h3><p className="mt-1 text-sm text-slate-500">These fields customise generated letters while preserving the supplied appointment-letter structure.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries({ companyName: "Company name", subject: "Subject", signatoryName: "Signatory name", signatoryTitle: "Signatory title" }).map(([field, label]) => <label key={field} className="text-sm font-medium">{label}<input className="input mt-1" value={template[field]} onChange={(e) => setTemplate({ ...template, [field]: e.target.value })} /></label>)}</div><div className="mt-3 grid gap-3"><label className="text-sm font-medium">Opening paragraph<textarea className="input mt-1 min-h-20" value={template.intro} onChange={(e) => setTemplate({ ...template, intro: e.target.value })} /></label><label className="text-sm font-medium">Main paragraph<textarea className="input mt-1 min-h-24" value={template.body} onChange={(e) => setTemplate({ ...template, body: e.target.value })} /></label><label className="text-sm font-medium">Closing paragraph<textarea className="input mt-1 min-h-20" value={template.closing} onChange={(e) => setTemplate({ ...template, closing: e.target.value })} /></label></div></section>
    <form onSubmit={sendExistingLetter} className="card"><h3 className="text-lg font-semibold">Send an LOR or experience letter</h3><p className="mt-1 text-sm text-slate-500">Generate a customised PDF for an existing intern and send it through the configured email service.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Intern<select className="input mt-1" value={letterForm.internId} onChange={(e) => setLetterForm({ ...letterForm, internId: e.target.value })} required><option value="">Choose an intern</option>{existingInterns.map((intern) => <option key={intern._id} value={intern._id}>{intern.name} - {intern.email}</option>)}</select></label><label className="text-sm font-medium">Letter type<select className="input mt-1" value={letterForm.type} onChange={(e) => setLetterForm({ ...letterForm, type: e.target.value })}><option>Letter of Recommendation</option><option>Letter of Experience</option><option>Offer Letter</option></select></label></div><button className="btn-primary mt-5" disabled={loading}>Generate and email letter</button></form>
  </div>;
}
