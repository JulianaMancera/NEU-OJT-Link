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



ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
     <Route path="/" element={<Login />} />
      <Route path="/landing-page" element={<LandingPage />} /> {/*  Landing Route */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/application-approval" element={<ApplicationApproval />} /> {/* ApplicationApproval */}
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/profile" element={<StudentProfile />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/company" element={<CompanyManagement />} />
      <Route path="/compilation-report" element={<CompilationReport />} />
      <Route path="/jobs" element={<AddJobs />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/monitoring" element={<Monitoring />} />
      <Route path="/user-role" element={<UserRole />} />
    </Routes>
  </BrowserRouter>
);
