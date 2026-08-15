import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function InternProfile() {
  const { user, setUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    profileImage: user?.profileImage || ""
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const submitProfile = async (event) => {
    event.preventDefault();
    try {
      const res = await api.put("/users/me", profileForm);
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
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message || "Password change failed");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <section className="card">
          <h2 className="mb-6 text-lg font-semibold">My Profile</h2>
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Name</p>
              <p className="mt-1 text-lg font-semibold">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</p>
              <p className="mt-1 text-lg font-semibold">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Department</p>
              <p className="mt-1 text-lg font-semibold">{user?.department || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Joining Date</p>
              <p className="mt-1 text-lg font-semibold">{user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : "-"}</p>
            </div>
          </div>
        </section>

        <form onSubmit={submitProfile} className="card">
          <h2 className="mb-6 text-lg font-semibold">Update Profile Picture</h2>
          <label className="block text-sm font-medium">Profile Image URL
            <input 
              className="input mt-1" 
              placeholder="https://example.com/image.jpg"
              value={profileForm.profileImage} 
              onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })} 
            />
          </label>
          <button className="btn-primary mt-6">Save Profile Picture</button>
        </form>

        <form onSubmit={handlePasswordChange} className="card">
          <h2 className="mb-6 text-lg font-semibold">Change Password</h2>
          <label className="block text-sm font-medium">New Password
            <input 
              className="input mt-1" 
              type="password" 
              value={passwordForm.newPassword} 
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
              required 
            />
          </label>
          <label className="mt-4 block text-sm font-medium">Confirm Password
            <input 
              className="input mt-1" 
              type="password" 
              value={passwordForm.confirmPassword} 
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
              required 
            />
          </label>
          <button className="btn-primary mt-6">Change Password</button>
        </form>
      </div>

      {user?.profileImage && (
        <div className="card h-fit">
          <h3 className="font-semibold">Profile Picture Preview</h3>
          <img src={user.profileImage} alt="Profile" className="mt-4 w-full rounded-md" />
        </div>
      )}
    </div>
  );
}
