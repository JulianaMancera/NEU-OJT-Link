import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, UserCog, Info } from "lucide-react";
import { supabase } from "../../../supabase";
import OJTLogo from "/src/assets/ojt-white.png";
import Sidebar from "./SideBar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user")
          .select("name, role, profilePicture")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setUserName(data.name || "Unknown");
          setUserRole(data.role || "user");
          setProfilePicture(data.profilePicture);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C]">
      {/* Fixed Header */}
      <div className="w-full h-[80px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-b border-black flex items-center justify-between px-6 z-50">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
        <div className="flex items-center">
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
            <div className="absolute right-6 top-[4.5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem] animate-slide-in-down">
              <div className="bg-blue-800 text-white p-4 text-center">
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden mb-3 border-4 border-blue-300">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
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
                    onClick={() => { navigate("/profile"); setProfileOpen(false); }}
                    className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                  >
                    <User className="w-6 h-6 mr-3" /> Profile
                  </button>
                </li>
                {userRole === "admin" && (
                  <li>
                    <button
                      onClick={() => { navigate("/admin"); setProfileOpen(false); }}
                      className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                    >
                      <UserCog className="w-6 h-6 mr-3" /> Admin
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => { navigate("/about"); setProfileOpen(false); }}
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
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Page content */}
      <div className={`p-8 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
