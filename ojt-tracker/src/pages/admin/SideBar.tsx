import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import OJTLogo2 from "/src/assets/ojt-link-logo FINAL.png";
import { Menu, LayoutDashboardIcon, ChevronDown, ChevronRight, Building2, Monitor, Pencil } from "lucide-react";

const monitoringRoutes = [
  "/application-approval",
  "/monitoring",
  "/reports",
  "/compilation-report",
];
const companyRoutes = ["/company", "/jobs"];

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [monitoringExpanded, setMonitoringExpanded] = useState(() =>
    monitoringRoutes.includes(location.pathname)
  );
  const [companyExpanded, setCompanyExpanded] = useState(() =>
    companyRoutes.includes(location.pathname)
  );

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (route: string) => {
    navigate(route);
    setSidebarOpen(false);
  };

  const navBtn = (path: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => handleNavigation(path)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full text-left ${
        isActive(path)
          ? "bg-[#0288D1] text-white"
          : "bg-[#B3E5FC] hover:bg-[#81D4FA] text-black"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  const subNavBtn = (path: string, label: string) => (
    <button
      key={label}
      onClick={() => handleNavigation(path)}
      className={`flex items-center gap-2 px-2 py-1 rounded w-full text-left transition-colors ${
        isActive(path)
          ? "bg-[#0288D1] text-white font-semibold"
          : "bg-gray-200 hover:bg-[#E1F5FE] text-black"
      }`}
    >
      <FaFileAlt className="text-sm shrink-0" />
      <span className="text-sm text-left">{label}</span>
    </button>
  );

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 text-white p-2 rounded"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 backdrop-blur-sm bg-transparent z-30 w-full"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-20 left-0 h-[calc(100%-5rem)] bg-white w-64 p-6 rounded-tr-2xl rounded-br-2xl shadow-lg transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="text-center mb-6">
          <img src={OJTLogo2} alt="OJT Logo" className="h-10 mx-auto" />
        </div>

        <div className="flex flex-col gap-4">
          {navBtn("/admin", "Dashboard", <LayoutDashboardIcon className="w-4 h-4" />)}
          {navBtn("/user-role", "User Role", <Pencil className="w-4 h-4" />)}

          {/* Student Monitoring collapsible */}
          <button
            onClick={() => setMonitoringExpanded(!monitoringExpanded)}
            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors w-full ${
              monitoringRoutes.includes(location.pathname)
                ? "bg-[#81D4FA] text-black"
                : "bg-[#B3E5FC] hover:bg-[#81D4FA] text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="text-sm font-medium">Student Monitoring</span>
            </span>
            {monitoringExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {monitoringExpanded && (
            <div className="ml-6 flex flex-col gap-2">
              {subNavBtn("/application-approval", "Application")}
              {subNavBtn("/monitoring", "Monitoring")}
              {subNavBtn("/reports", "Reports")}
              {subNavBtn("/compilation-report", "Compilation of Reports")}
            </div>
          )}

          {/* Company & Jobs collapsible */}
          <button
            onClick={() => setCompanyExpanded(!companyExpanded)}
            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors w-full ${
              companyRoutes.includes(location.pathname)
                ? "bg-[#81D4FA] text-black"
                : "bg-[#B3E5FC] hover:bg-[#81D4FA] text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">Company Management</span>
            </span>
            {companyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {companyExpanded && (
            <div className="ml-6 flex flex-col gap-2">
              {subNavBtn("/company", "Company")}
              {subNavBtn("/jobs", "Jobs")}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
