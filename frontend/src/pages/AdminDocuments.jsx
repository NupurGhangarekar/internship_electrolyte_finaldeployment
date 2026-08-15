import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { API_URL } from "../api/client";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

export default function AdminDocuments() {
  const { user } = useAuth();
  const [interns, setInterns] = useState([]);
  const [internId, setInternId] = useState("");
  const [docs, setDocs] = useState([]);
  const [type, setType] = useState("Certificate");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/users", { params: { role: "intern", limit: 100 } }).then((res) => setInterns(res.data));
  }, []);

  const load = () => {
    if (!internId) return;
    setLoading(true);
    api.get(`/documents/${internId}`).then((res) => setDocs(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, [internId]);

  const upload = async (event) => {
    event.preventDefault();
    if (!file || !internId) return toast.error("Select intern and file");
    const data = new FormData();
    data.append("intern", internId);
    data.append("type", type);
    data.append("file", file);
    try {
      await api.post("/documents/upload", data);
      toast.success("Document saved");
      setFile(null);
      load();
    } catch (error) {
      toast.error(error.message || "Upload failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success("Document deleted");
      load();
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={upload} className="card grid gap-4 md:grid-cols-4">
        <select className="input" value={internId} onChange={(e) => setInternId(e.target.value)} required>
          <option value="">Select intern</option>
          {interns.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option>Certificate</option>
          <option>Letter of Recommendation</option>
          <option>Completion Certificate</option>
          <option>Other</option>
        </select>
        <input className="input" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0])} />
        <button className="btn-primary">Upload or replace</button>
      </form>

      <section className="card overflow-hidden">
        {loading ? <Spinner /> : docs.length === 0 ? <EmptyState title="No documents available" message="Select an intern or upload a document." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-th">Type</th><th className="table-th">File</th><th className="table-th">Uploaded</th><th className="table-th">Actions</th></tr></thead>
              <tbody>{docs.map((doc) => (
                <tr key={doc._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="table-td">{doc.type}</td>
                  <td className="table-td">{doc.originalName}</td>
                  <td className="table-td">{formatDate(doc.uploadDate)}</td>
                  <td className="table-td">
                    <a className="mr-3 text-brand-600" href={`${API_URL}/${doc.path}`} download target="_blank" rel="noreferrer">Download</a>
                    <button className="text-red-600" onClick={() => remove(doc._id)}>Delete</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
