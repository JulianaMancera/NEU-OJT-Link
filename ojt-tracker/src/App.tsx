import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CompanyList from "./pages/CompanyList";
import './App.css'
import WeeklyReport from "./pages/WeeklyReport";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Login Route */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Dashboard Route */}
        <Route path="/companies" element={<CompanyList />} /> {/* CompanyList */}
        <Route path="/weekly-report" element={<WeeklyReport />} /> {/* WeeklyReport */}
      </Routes>
    </Router>
  );
}
