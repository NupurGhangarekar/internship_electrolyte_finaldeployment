import React, { useEffect, useState } from "react";
import api, { API_URL } from "../api/client";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";
import { Download, File } from "lucide-react";

export default function InternDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id || user?._id) {
      setLoading(true);
      api.get("/documents/me/list")
        .then((res) => setDocs(res.data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const documentTypes = {
    Certificate: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    "Letter of Recommendation": "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    "Completion Certificate": "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold">My Documents</h2>
        <p className="mt-1 text-sm text-slate-500">Documents uploaded by your admin including certificates and recommendation letters.</p>
      </section>

      <section>
        {loading ? (
          <div className="card"><Spinner /></div>
        ) : docs.length === 0 ? (
          <div className="card"><EmptyState title="No documents yet" message="Your admin will upload certificates and letters here as you complete your internship." /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <div key={doc._id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${documentTypes[doc.type] || documentTypes.Certificate}`}>
                  <File size={14} /> {doc.type}
                </div>
                <h3 className="mt-3 font-semibold text-slate-900 dark:text-white line-clamp-2">{doc.originalName}</h3>
                <p className="mt-2 text-xs text-slate-500">Uploaded: {formatDate(doc.uploadDate)}</p>
                <p className="text-xs text-slate-500">Size: {(doc.size / 1024).toFixed(2)} KB</p>
                <a
                  href={`${API_URL}/${doc.path}`}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600"
                >
                  <Download size={16} /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
