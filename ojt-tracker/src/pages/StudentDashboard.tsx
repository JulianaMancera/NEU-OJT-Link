import React, { useState, useEffect } from "react";
import { User, Settings, LogOut, CircleHelp, Menu, UserCog } from "lucide-react";
import { supabase } from "../../supabase";
import logo from "../assets/ojt-white.png";
import StudentSide from "./student/StudentSide";
import ScheduleSide from "./student/ScheduleSide";
import ReportsSide from "./student/ReportSide";
import { useNavigate, useLocation } from "react-router-dom";

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<"schedule" | "reports">("schedule");
  const [isBlurred, setIsBlurred] = useState(false);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleViewChange = (view: "schedule" | "reports") => {
    console.log("handleViewChange called, new view:", view);
    setActiveView(view);
    console.log("activeView updated to:", view);
  };

  const handleToggleBlur = (isBlurred: boolean) => {
    setIsBlurred(isBlurred);
  };

  const handleSidebarClick = () => {
    // No action needed here
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false); // Close the sidebar
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const sidebar = document.querySelector(".sidebar");
    if (isSidebarOpen && sidebar && !sidebar.contains(e.target as Node)) {
      setIsSidebarOpen(false);
      setIsBlurred(false);
    }
  };

  const isHomePage = location.pathname === "/student-dashboard";
  const isExploreJobsPage = location.pathname === "/explore-jobs";

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-br from-blue-50 to-blue-200" onClick={handleBackgroundClick}>
      <header className="fixed top-0 h-[80px] left-0 w-full bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-md z-50 border-b border-black">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-3 hover:bg-blue-800 rounded-full transition-all duration-300"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="w-8 h-8 text-white" />
          </button>
          <img src={logo} alt="OJT Link Logo" className="w-32 h-auto" />
          <button
            onClick={() => setActiveView("schedule")}
            className={`text-white px-5 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
              isHomePage ? "bg-blue-700 hover:brightness-110" : "bg-transparent hover:bg-blue-700"
            }`}
          >
            HOME
          </button>
          <button
            onClick={() => navigate("/view-dashboard")}
            className={`text-white px-5 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ${
              isExploreJobsPage ? "bg-blue-700 hover:brightness-110" : "bg-transparent hover:bg-blue-700"
            }`}
          >
            EXPLORE JOBS
          </button>
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
          <div className="absolute right-6 top-[5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem] animate-slide-in-down">
            <div className="bg-blue-800 text-white p-4 text-center">
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
                  <User className="w-6 h-6 mr-3" /> Profile
                </button>
              </li>
              <li>
                <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                  <Settings className="w-6 h-6 mr-3" /> Settings
                </button>
              </li>
              <li>
                <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                  <CircleHelp className="w-6 h-6 mr-3" /> Help & Support
                </button>
              </li>
              {userRole === "admin" && (
                <li>
                  <button
                    onClick={() => navigate("/admin")}
                    className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                  >
                    <UserCog className="w-6 h-6 mr-3" /> Admin
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

      <div className="flex h-screen pt-[80px]">
        <div
          className={`fixed top-[80px] left-0 h-[calc(100vh-80px)] w-64 bg-gray-100 shadow-inner z-40 transition-transform duration-300 sidebar ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <StudentSide
            onViewChange={handleViewChange}
            activeView={activeView}
            onToggleBlur={handleToggleBlur}
            isSidebarOpen={isSidebarOpen}
            onSidebarClick={handleSidebarClick}
            onCloseSidebar={handleCloseSidebar} // Pass the close handler
          />
        </div>

        <div
          className={`flex-1 overflow-y-auto p-11 relative z-30 transition-all duration-300 ${
            isBlurred ? "blur-sm" : ""
          }`}
        >
          {activeView === "schedule" && <ScheduleSide />}
          {activeView === "reports" && <ReportsSide />}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;