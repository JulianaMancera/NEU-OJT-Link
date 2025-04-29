import React, { useState, useEffect, useRef } from "react";
import { User, Settings, LogOut, CircleHelp, Menu } from "lucide-react";
import { supabase } from "../../supabase";
import logo from "../assets/ojt-logo-dashboard.svg";
import StudentSide from "../components/StudentSide";
import ScheduleSide from "../components/ScheduleSide";
import ReportsSide from "../components/ReportSide";
import { useNavigate } from "react-router-dom";

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Changed to false
  const [activeView, setActiveView] = useState<"schedule" | "reports">("schedule");
  const isResizing = useRef(false);

  // Ensure sidebar is closed on initial render (e.g., page refresh)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "User");
        const { data: roleData } = await supabase
          .from("user")
          .select("role, profilePicture")
          .eq("user_id", user.id)
          .single();

        if (roleData) {
          setUserRole(roleData.role);
          setProfilePicture(roleData.profilePicture);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Resizing logic
  const startResizing = () => {
    isResizing.current = true;
  };

  const stopResizing = () => {
    isResizing.current = false;
  };

  const resize = (e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = e.clientX;
      if (newWidth > 300 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-br from-blue-50 to-blue-200">
      {/* Header */}
      <header className="fixed top-0 h-[80px] left-0 w-full bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-md z-50 border-b border-black">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-3 hover:bg-blue-800 rounded-full transition-all duration-300"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="w-8 h-8 text-white" />
          </button>
          <img src={logo} alt="OJT Link Logo" className="w-52 h-52" />
          <button className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg">
            HOME
          </button>
          <span className="text-xl font-semibold tracking-wide">Explore Jobs</span>
        </div>
        <button
          onClick={() => setProfileOpen(!isProfileOpen)}
          className="relative p-3 hover:bg-blue-800 rounded-full transition-all duration-300"
        >
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
            />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </button>

        {isProfileOpen && (
          <div className="absolute right-6 top-20 bg-white text-gray-800 shadow-2xl rounded-xl w-80 z-50 animate-slide-down">
            <div className="bg-blue-700 text-white p-6 text-center rounded-t-xl">
              <div className="w-24 h-24 rounded-full mx-auto overflow-hidden mb-3 border-4 border-blue-300">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 mx-auto text-white" />
                )}
              </div>
              <p className="font-semibold text-xl">{userName}</p>
              <p className="text-sm text-blue-200 capitalize">{userRole}</p>
            </div>
            <ul className="text-sm">
              <li>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                >
                  <User className="w-6 h-6 mr-3 text-blue-600" /> Profile
                </button>
              </li>
              <li>
                <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                  <Settings className="w-6 h-6 mr-3 text-blue-600" /> Settings
                </button>
              </li>
              <li>
                <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                  <CircleHelp className="w-6 h-6 mr-3 text-blue-600" /> Help & Support
                </button>
              </li>
              {userRole === "admin" && (
                <li>
                  <button
                    onClick={() => navigate("/admin")}
                    className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                  >
                    🛠️ Admin
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-6 py-4 hover:bg-red-50 text-red-600 flex items-center transition-all duration-200"
                >
                  <LogOut className="w-6 h-6 mr-3" /> Log out
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* Main Layout with Resizable Sidebar on the Left */}
      <div className="flex h-screen pt-24">
        {/* Sidebar with StudentSide (Buttons Only) */}
        <div
          className={`overflow-y-auto p-10 bg-blue-50 shadow-inner transition-all duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:static md:shadow-none`}
          style={{
            width: isSidebarOpen ? `${sidebarWidth}px` : "0",
            minWidth: isSidebarOpen ? "300px" : "0",
            maxWidth: isSidebarOpen ? "600px" : "0",
            visibility: isSidebarOpen ? "visible" : "hidden",
          }}
        >
          <StudentSide onViewChange={setActiveView} activeView={activeView} />
        </div>

        {/* Resizable Divider (only shown when sidebar is open) */}
        {isSidebarOpen && (
          <div
            className="w-2 bg-gray-300 cursor-col-resize hover:bg-blue-500 transition-all duration-200"
            onMouseDown={startResizing}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-10">
          {activeView === "schedule" && <ScheduleSide />}
          {activeView === "reports" && <ReportsSide />}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;