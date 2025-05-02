import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, CircleHelp } from "lucide-react";
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

  const isExploreJobsPage = location.pathname === "/explore-jobs"; // Explore Jobs (company selection dashboard) page


  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Topbar/Header */}
      <header className="fixed top-0 h-[80px] left-0 w-full bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-md z-50 border-b border-black">
        <div className="flex items-center space-x-4">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
          <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
          <span className="text-lg font-semibold ml-5">Admin Dashboard</span>
          <button
            onClick={() => navigate("/dashboard", { state: { isAdminView: true } })}              // Navigate to Explore Jobs (company selection dashboard) page
            className={`text-white px-5 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg ml-5 ${
              isExploreJobsPage ? "bg-blue-700 hover:brightness-110" : "bg-transparent hover:bg-blue-700"
            }`}
          >
            Explore Jobs
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
                         <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                           <Settings className="w-6 h-6 mr-3" /> Settings
                         </button>
                       </li>
                       <li>
                         <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                           <CircleHelp className="w-6 h-6 mr-3 " /> Help & Support
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
        </div>

        {/* Main Content - Adjust margin based on sidebar state */}
        <div className={`flex-1 bg-white p-6 rounded-lg shadow-md border border-black transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          <h2 className="text-xl font-semibold mb-4 text-[#2B4764]">Welcome, Admin!</h2>
          <p className="text-gray-600">Select a section from the left to get started.</p>
        </div>
      </div>
  );
};

export default Admin;