import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileAlt } from "react-icons/fa";
import { User, Settings, LogOut, CircleHelp, MoonStar, Menu } from "lucide-react";
import { supabase } from "../../../supabase";
import OJTLogo from "/src/assets/ojt-logo-dashboard.svg";
import OJTLogo2 from "/src/assets/ojt-link-logo FINAL.png";

const Admin = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState("");
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { label: "Application", route: "/application-approval" },
    { label: "Monitoring", route: "#" },
    { label: "Company Management", route: "/company" },
    { label: "Reports", route: "#" },
    { label: "Jobs", route: "/jobs" },
  ];

  const handleNavigation = (route: string, label: string) => {
    setActive(label);
    if (route !== "#") {
      navigate(route);
    }
  };

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
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Topbar/Header */}
      <header className="fixed top-0 h-[80px] left-0 w-full bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-md z-50 border-b border-black">
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-blue-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px]" />
          <span className="text-lg font-semibold ml-5">Admin Dashboard</span>
        </div>
        <button
          onClick={() => setProfileOpen(!isProfileOpen)}
          className="relative p-2 hover:bg-violet-100 rounded-full transition-colors overflow-hidden"
        >
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </button>

        {isProfileOpen && (
          <div className="absolute right-6 top-[4.5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem]">
            <div className="bg-violet-800 text-black p-4 text-center">
              <div className="w-16 h-16 rounded-full mx-auto overflow-hidden mb-2">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 mx-auto text-white" />
                )}
              </div>
              <p className="font-semibold">{userName}</p>
              <p className="text-xs text-violet-200">{userRole}</p>
            </div>
            <ul className="text-sm">
              <li>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                >
                  <User className="w-4 h-4 mr-2" /> Profile
                </button>
              </li>
              <li>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </button>
              </li>
              <li>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                  <MoonStar className="w-4 h-4 mr-2" /> Appearance
                </button>
              </li>
              <li>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                  <CircleHelp className="w-4 h-4 mr-2" /> Help & Support
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex pt-24 space-x-6">
        {/* Sidebar - Now with conditional rendering based on sidebarOpen state */}
        <div 
         className={`fixed top-20 left-0 h-[calc(100%-5rem)] bg-white rounded-tr-2xl rounded-br-2xl shadow-lg w-64 p-6 transition-transform duration-300 ease-in-out z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          }`}
        >
          <div className="text-center mb-6">
            <img src={OJTLogo2} alt="NEU OJT LINK" className="h-10 mx-auto" />
          </div>
          <div className="flex flex-col gap-4">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.route, item.label)}
                className={`flex items-center gap-2 bg-[#B3E5FC] px-4 py-2 rounded-lg hover:bg-[#81D4FA] transition-all text-black ${
                  active === item.label ? "ring-2 ring-[#0288D1]" : ""
                }`}
              >
                <FaFileAlt />
                <span className="text-sm font-medium text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overlay to close sidebar on mobile when clicked outside */}
        {sidebarOpen && (
          <div 
            onClick={toggleSidebar}
            className="fixed inset-0 backdrop-blur-sm bg-transparent z-40"
            style={{ display: sidebarOpen ? 'block' : 'none' }}
          ></div>
        )}

        {/* Main Content - Adjust margin based on sidebar state */}
        <div className={`flex-1 bg-white p-6 rounded-lg shadow-md border border-black transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          <h2 className="text-xl font-semibold mb-4 text-[#2B4764]">Welcome, Admin!</h2>
          <p className="text-gray-600">Select a section from the left to get started.</p>
        </div>
      </div>
    </div>
  );
};

export default Admin;