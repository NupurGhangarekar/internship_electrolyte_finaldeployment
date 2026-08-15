import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import InternLayout from "./layouts/InternLayout";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import InternDashboard from "./pages/InternDashboard";
import Interns from "./pages/Interns";
import AdminTasks from "./pages/AdminTasks";
import InternTasks from "./pages/InternTasks";
import AdminDocuments from "./pages/AdminDocuments";
import InternDocuments from "./pages/InternDocuments";
import AdminProfile from "./pages/AdminProfile";
import InternProfile from "./pages/InternProfile";
import Projects from "./pages/Projects";
import Calendar from "./pages/Calendar";
import ProjectDetails from "./pages/ProjectDetails";
import KanbanBoard from "./pages/KanbanBoard";

function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to={user?.role === "admin" ? "/admin" : "/intern"} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/intern"} /> : <Login />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="interns" element={<Interns />} />
        <Route path="projects" element={<Projects mode="admin" />} />
        <Route path="projects/:id" element={<ProjectDetails mode="admin" />} />
        <Route path="board" element={<KanbanBoard mode="admin" />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="documents" element={<AdminDocuments />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
      <Route path="/intern" element={<ProtectedRoute role="intern"><InternLayout /></ProtectedRoute>}>
        <Route index element={<InternDashboard />} />
        <Route path="projects" element={<Projects mode="intern" />} />
        <Route path="projects/:id" element={<ProjectDetails mode="intern" />} />
        <Route path="board" element={<KanbanBoard mode="intern" />} />
        <Route path="tasks" element={<InternTasks />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="documents" element={<InternDocuments />} />
        <Route path="profile" element={<InternProfile />} />
      </Route>
      <Route path="*" element={<Navigate to={user?.role === "admin" ? "/admin" : user ? "/intern" : "/login"} />} />
    </Routes>
  );
}
