import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import OJTLogo2 from "/src/assets/ojt-link-logo FINAL.png";
import { Menu, LayoutDashboardIcon, ChevronDown, ChevronRight, Building2, Monitor, Pencil } from "lucide-react";

const Sidebar = ({ sidebarOpen, setSidebarOpen }: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const [active, setActive] = useState("");
  const [monitoringExpanded, setMonitoringExpanded] = useState(false);
  const [companyExpanded, setCompanyExpanded] = useState(false);

  const handleNavigation = (route: string, label: string) => {
    setActive(label);
    navigate(route);
  };

  return (
    <>
      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 bg text-white p-2 rounded"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Background Blur */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 backdrop-blur-sm bg-transparent z-30 w-full"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-20 left-0 h-[calc(100%-5rem)] bg-white w-64 p-6 rounded-tr-2xl rounded-br-2xl shadow-lg transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="text-center mb-6">
          <img src={OJTLogo2} alt="OJT Logo" className="h-10 mx-auto" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Dashboard */}
          <button
            onClick={() => handleNavigation("/admin", "Dashboard")}
            className={`flex items-center gap-2 bg-[#B3E5FC] px-4 py-2 rounded-lg hover:bg-[#81D4FA] text-black ${
              active === "Dashboard" ? "ring-2 ring-[#0288D1]" : ""
            }`}
          >
            <LayoutDashboardIcon />
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          {/* User Role */}
          <button
            onClick={() => handleNavigation("/user-role", "User Role")}
            className={`flex items-center gap-2 bg-[#B3E5FC] px-4 py-2 rounded-lg hover:bg-[#81D4FA] text-black ${
              active === "User Role" ? "ring-2 ring-[#0288D1]" : ""
            }`}
          >
            <Pencil />
            <span className="text-sm font-medium">User Role</span>
          </button>

          {/* Collapsible: Student Monitoring */}
          <button
            onClick={() => setMonitoringExpanded(!monitoringExpanded)}
            className="flex items-center justify-between bg-[#B3E5FC] px-4 py-4 rounded-lg hover:bg-[#81D4FA] text-black"
          >
            <span className="flex items-center gap-2">
              <Monitor className="text-sm" />
              <span className="text-sm font-medium text-left">Student Monitoring</span>
            </span>
            <span className="translate-x-2">
              {monitoringExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16}/>}
            </span>
          </button>

          {/* Collapsed Submenu */}
          {monitoringExpanded && (
            <div className="ml-6 flex flex-col gap-2">
              {[
                { label: "Application", route: "/application-approval" },
                { label: "Monitoring", route: "/monitoring" },
                { label: "Reports", route: "/reports" },
                { label: "Compilation of Reports", route: "/company" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.route, item.label)}
                  className={`flex items-center gap-2 px-2 py-1 rounded bg-gray-200 hover:bg-[#E1F5FE] text-black animate-dropdown-expand ${
                    active === item.label ? "font-semibold underline" : ""
                  }`}
                >
                  <FaFileAlt className="text-sm" />
                  <span className="text-sm text-left">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Collapsible: Company & Jobs */}
          <button
            onClick={() => setCompanyExpanded(!companyExpanded)}
            className="flex items-center justify-between bg-[#B3E5FC] px-4 py-4 rounded-lg hover:bg-[#81D4FA] text-black"
          >
            <span className="flex items-center gap-2">
              <Building2 className="text-sm" />
              <span className="text-sm font-medium text-left">Company Management</span>
            </span>
            <span className="translate-x-2">
              {companyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          </button>

          {/* Collapsed Submenu */}
          {companyExpanded && (
            <div className="ml-6 flex flex-col gap-2">
              {[
                { label: "Company", route: "/company" },
                { label: "Jobs", route: "/jobs" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.route, item.label)}
                  className={`flex items-center gap-2 px-2 py-1 rounded bg-gray-200 hover:bg-[#E1F5FE] text-black animate-dropdown-expand ${
                    active === item.label ? "font-semibold underline" : ""
                  }`}
                >
                  <FaFileAlt className="text-sm" />
                  <span className="text-sm text-left">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;