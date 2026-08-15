import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@example.com", password: "password123" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success("Welcome back");
      navigate(user.role === "admin" ? "/admin" : "/intern");
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4 dark:bg-slate-950">
      <form onSubmit={submit} className="card w-full max-w-md">
        <h1 className="text-2xl font-bold">Internship Portal</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage onboarding, tasks, and documents.</p>
        <label className="mt-6 block text-sm font-medium">Email</label>
        <input className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <input className="input mt-1" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        <p className="mt-4 text-xs text-slate-500">Seed users: admin@example.com or aarav@example.com, password password123.</p>
      </form>
    </main>
  );
}
