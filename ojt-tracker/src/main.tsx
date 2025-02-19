import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import './index.css'
import Dashboard from "./pages/Dashboard";
import CompanyList from "./pages/CompanyList";
import WeeklyReport from "./pages/WeeklyReport";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/companies" element={<CompanyList />} /> 
      <Route path="/weekly-report" element={<WeeklyReport />} />

    </Routes>
  </BrowserRouter>
);
