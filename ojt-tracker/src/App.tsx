import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import './App.css'
import LandingPage from "./pages/LandingPage";
import StudentDashboard from "./pages/StudentDashboard";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Login Route */}
        <Route path="/landing-page" element={<LandingPage />} /> {/*  Landing Route */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Dashboard Route */}
        <Route path="/student-dashboard" element={<StudentDashboard />} /> {/* Student DashBoard Route */}
        
      </Routes>
    </Router>
  );
}
