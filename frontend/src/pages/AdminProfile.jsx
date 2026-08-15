import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
    joiningDate: user?.joiningDate?.slice(0, 10) || "",
    profileImage: user?.profileImage || ""
  });
  const [changing, setChanging] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

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

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    try {
      await api.put("/users/me", { password: passwordForm.newPassword });
      toast.success("Password changed successfully");
      setChanging(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message || "Password change failed");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form onSubmit={submit} className="card">
          <h2 className="mb-6 text-lg font-semibold">Edit Profile</h2>
          <label className="block text-sm font-medium">Name<input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="mt-4 block text-sm font-medium">Department<input className="input mt-1" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
          <label className="mt-4 block text-sm font-medium">Joining Date<input className="input mt-1" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></label>
          <label className="mt-4 block text-sm font-medium">Profile Image URL<input className="input mt-1" value={form.profileImage} onChange={(e) => setForm({ ...form, profileImage: e.target.value })} /></label>
          <button className="btn-primary mt-6">Save Profile</button>
        </form>

        <form onSubmit={handlePasswordChange} className="card mt-6">
          <h2 className="mb-6 text-lg font-semibold">Change Password</h2>
          <label className="block text-sm font-medium">New Password<input className="input mt-1" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required /></label>
          <label className="mt-4 block text-sm font-medium">Confirm Password<input className="input mt-1" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required /></label>
          <button className="btn-primary mt-6">Change Password</button>
        </form>
      </div>

      <div className="card h-fit">
        <h3 className="font-semibold">Account Info</h3>
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-slate-500">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-slate-500">Role</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-slate-500">Joined</p>
            <p className="font-medium">{user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
