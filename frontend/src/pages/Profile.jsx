import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "",
    department: user.department || "",
    joiningDate: user.joiningDate?.slice(0, 10) || "",
    profileImage: user.profileImage || ""
  });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const res = await api.put("/users/me", form);
      const next = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(next));
      setUser(next);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message || "Profile update failed");
    }
  };

  return (
    <form onSubmit={submit} className="card max-w-2xl">
      <h2 className="text-lg font-semibold">Profile</h2>
      <label className="mt-4 block text-sm font-medium">Name<input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label className="mt-4 block text-sm font-medium">Department<input className="input mt-1" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
      <label className="mt-4 block text-sm font-medium">Joining date<input className="input mt-1" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></label>
      <label className="mt-4 block text-sm font-medium">Profile image URL<input className="input mt-1" value={form.profileImage} onChange={(e) => setForm({ ...form, profileImage: e.target.value })} /></label>
      <button className="btn-primary mt-5">Save profile</button>
    </form>
  );
}
