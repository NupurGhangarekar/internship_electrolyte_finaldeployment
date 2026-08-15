import React from "react";

export default function StatusBadge({ value }) {
  const map = {
    Backlog: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
    "To Do": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
    Pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
    "In Progress": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100",
    Review: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-100",
    Submitted: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-100",
    Blocked: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-100",
    Completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100"
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[value] || map.Pending}`}>{value}</span>;
}
