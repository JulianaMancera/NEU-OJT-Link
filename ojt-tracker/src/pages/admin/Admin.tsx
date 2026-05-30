import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Info, Users, Briefcase, Building2 } from "lucide-react";
import { supabase } from "../../../supabase";
import OJTLogo from "/src/assets/ojt-white.png";
import Sidebar from "./SideBar";

const Admin = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "User");
        const { data: roleData } = await supabase
          .from("user")
          .select("name, role, profilePicture")
          .eq("user_id", user.id)
          .single();

        if (roleData) {
          setUserName(roleData.name || "Unknown");
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

  const isExploreJobsPage = location.pathname === "/explore-jobs"; // Explore Jobs (company selection dashboard) page

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Topbar/Header */}
      <header className="fixed top-0 h-[80px] left-0 w-full bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center space-x-4">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
          <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
          <span className="text-lg font-semibold ml-5">Admin Dashboard</span>
          <button
            onClick={() => navigate("/view-dashboard", { state: { isAdminView: true } })}
            className={`text-white px-5 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ml-5 ${
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
            <User className="w-6 h-6 text-white" />
          )}
        </button>

        {isProfileOpen && (
          <div className="absolute right-6 top-[4.5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem] animate-slide-in-down">
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
                <button
                  onClick={() => {
                    navigate("/about");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                >
                  <Info className="w-6 h-6 mr-3" /> About Us
                </button>
              </li>
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

      {/* Sidebar + Main Content */}
      <div className="flex pt-24 space-x-6">
        {/* Main Content - Adjust margin based on sidebar state */}
        <div className={`flex-1 bg-white p-8 rounded-lg shadow-md border border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#2B4764] mb-2">Welcome, {userName}!</h2>
            <p className="text-gray-600 text-lg">Manage your platform efficiently with the tools below or select a section from the sidebar to get started.</p>
          </div>

          {/* Quick Actions Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => navigate("/user-role")}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-blue-200 flex items-start gap-4"
            >
              <div className="p-3 bg-blue-200 rounded-full flex-shrink-0">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#2B4764] mb-2">Manage Users</h3>
                <p className="text-gray-600">View and edit user profiles, roles, and permissions.</p>
              </div>
            </div>
            <div
              onClick={() => navigate("/view-dashboard", { state: { isAdminView: true } })}
              className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-green-200 flex items-start gap-4"
            >
              <div className="p-3 bg-green-200 rounded-full flex-shrink-0">
                <Briefcase className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#2B4764] mb-2">Explore Jobs</h3>
                <p className="text-gray-600">Review and manage job postings across companies.</p>
              </div>
            </div>
            <div
              onClick={() => navigate("/company")}
              className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-purple-200 flex items-start gap-4"
            >
              <div className="p-3 bg-purple-200 rounded-full flex-shrink-0">
                <Building2 className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#2B4764] mb-2">Companies</h3>
                <p className="text-gray-600">Manage company profiles and their job listings.</p>
              </div>
            </div>
          </div>

          {/* Recent Activity Section - placeholder*/}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-[#2B4764] mb-4">Recent Activity</h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600">No recent activity to display. Start managing users or jobs to see updates here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;