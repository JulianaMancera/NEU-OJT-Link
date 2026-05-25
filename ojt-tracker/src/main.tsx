import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import './index.css'
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import ApplicationApproval from "./pages/admin/ApplicationApproval";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/profile/StudentProfile";
import Admin from "./pages/admin/Admin";
import CompanyManagement from "./pages/admin/CompanyManagement";
import AddJobs from "./pages/admin/AddJobs";
import Reports from "./pages/admin/Reports";
import Monitoring from "./pages/admin/Monitoring";
import CompilationReport from "./pages/admin/CompilationReport";
import UserRole from "./pages/admin/UserRole";
import ViewDashboard from "./components/ViewDashboard";
import AboutUs from "../src/pages/AboutUs";
import { supabase } from '../supabase';
import ProtectedRoute from "./components/ProtectedRoute";

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '/';
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />

      {/* Student-only */}
      <Route path="/landing-page" element={<ProtectedRoute requiredRole="student"><LandingPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><Dashboard /></ProtectedRoute>} />
      <Route path="/student-dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />

      {/* Admin-only */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
      <Route path="/application-approval" element={<ProtectedRoute requiredRole="admin"><ApplicationApproval /></ProtectedRoute>} />
      <Route path="/company" element={<ProtectedRoute requiredRole="admin"><CompanyManagement /></ProtectedRoute>} />
      <Route path="/compilation-report" element={<ProtectedRoute requiredRole="admin"><CompilationReport /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute requiredRole="admin"><AddJobs /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute requiredRole="admin"><Monitoring /></ProtectedRoute>} />
      <Route path="/user-role" element={<ProtectedRoute requiredRole="admin"><UserRole /></ProtectedRoute>} />

      {/* Authenticated (any NEU role) */}
      <Route path="/view-dashboard" element={<ProtectedRoute><ViewDashboard /></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><AboutUs handleLogout={handleLogout} /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
);