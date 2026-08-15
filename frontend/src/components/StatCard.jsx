import React from "react";

export default function StatCard({ title, value, tone = "blue" }) {
  const tones = {
    blue: "bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-50",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-50",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-700/20 dark:text-amber-50",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
  };
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-3 inline-flex rounded-md px-3 py-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
