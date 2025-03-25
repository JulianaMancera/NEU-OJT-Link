import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import './App.css'
import WeeklyReport from "./pages/WeeklyReport";
import LandingPage from "./pages/LandingPage";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Login Route */}
        <Route path="/landing-page" element={<LandingPage />} /> {/*  Landing Route */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Dashboard Route */}
        <Route path="/weekly-report" element={<WeeklyReport />} /> {/* WeeklyReport */}
        <Route path="/application-approval" element={<ApplicationApproval />} /> {/* ApplicationApproval */}
      </Routes>
    </Router>
  );
}
