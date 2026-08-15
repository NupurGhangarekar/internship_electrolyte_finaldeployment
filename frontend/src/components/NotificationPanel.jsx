import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import api from "../api/client";
import { formatDate } from "../utils/format";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const navigate = useNavigate();
  const { user } = useAuth();

  const load = () => {
    api.get("/notifications").then((res) => {
      setItems(res.data);
      setUnread(res.meta?.unread || 0);
    }).catch(() => {});
  };

  useEffect(load, []);

  const markAll = async () => {
    await api.put("/notifications/read-all");
    load();
  };

  const markOne = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to mark read");
    }
  };

  const openItem = (item) => {
    // Navigate based on related ids
    const base = user?.role === "admin" ? "/admin" : "/intern";
    if (item.relatedProject) return navigate(`${base}/projects/${item.relatedProject}`);
    if (item.relatedTask) return navigate(`${base}/board?openTask=${item.relatedTask}${item.relatedProject ? `&project=${item.relatedProject}` : ""}`);
    return null;
  };

  return (
    <div className="relative">
      <button className="relative rounded-md border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900" onClick={() => setOpen(!open)} aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button className="text-xs text-brand-600" onClick={markAll}>Mark all read</button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {items.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No notifications yet.</p> : items.map((item) => (
              <div key={item._id} className={`rounded-md border p-3 text-sm ${item.read ? "border-slate-100 dark:border-slate-800" : "border-brand-200 bg-brand-50 dark:border-brand-700 dark:bg-brand-700/10"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1" role="button" onClick={() => { openItem(item); if (!item.read) markOne(item._id); }}>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="shrink-0">
                    {!item.read && <button className="text-xs text-brand-600" onClick={() => markOne(item._id)}>Mark read</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
