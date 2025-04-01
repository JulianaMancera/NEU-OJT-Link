import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import './index.css'
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import ApplicationApproval from "./pages/ApplicationApproval";
import StudentDashboard from "./pages/StudentDashboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
     <Route path="/" element={<Login />} />
      <Route path="/landing-page" element={<LandingPage />} /> {/*  Landing Route */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/application-approval" element={<ApplicationApproval />} /> {/* ApplicationApproval */}
      <Route path="/student-dashboard" element={<StudentDashboard />} />

    </Routes>
  </BrowserRouter>
);