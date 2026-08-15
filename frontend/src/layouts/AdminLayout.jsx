import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Award, CalendarDays, ClipboardList, FileText, FolderKanban, LayoutDashboard, LogOut, Moon, Sun, User, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationPanel from "../components/NotificationPanel";

const icons = { Dashboard: LayoutDashboard, Interns: Users, Projects: FolderKanban, Tasks: ClipboardList, Calendar: CalendarDays, Documents: FileText, Profile: User };

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const nav = [
    ["Dashboard", "/admin"],
    ["Interns", "/admin/interns"],
    ["Projects", "/admin/projects"],
    ["Board", "/admin/board"],
    ["Tasks", "/admin/tasks"],
    ["Calendar", "/admin/calendar"],
    ["Documents", "/admin/documents"],
    ["Profile", "/admin/profile"]
  ];

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(document.documentElement.classList.contains("dark"));
  };

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-600 p-2 text-white"><Award size={22} /></div>
          <div>
            <p className="font-bold">Intern Portal</p>
            <p className="text-xs text-slate-500">admin workspace</p>
          </div>
        </div>
        <nav className="mt-8 grid gap-2">
          {nav.map(([label, href]) => {
            const Icon = icons[label];
            return (
              <NavLink key={href} to={href} end={href === "/admin"} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                <Icon size={18} /> {label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-8 grid gap-2">
          <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={toggleDark}>{dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? "Light mode" : "Dark mode"}</button>
          <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={doLogout}><LogOut size={18} /> Logout</button>
        </div>
      </aside>
      <main className="p-4 lg:ml-64 lg:min-h-screen lg:flex-1 lg:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Welcome back,</p>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">{user?.email}</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
