import { useEffect, useState, ChangeEvent } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "./SideBar";
import { MessageNotification } from "../../components/MessageNotification";
import OJTLogo from "/src/assets/ojt-white.png";
import { User, Settings, CircleHelp, LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";

type User = {
  user_id: string;
  email: string;
  name: string | null;
  profilePicture: string | null;
  date_registered: string;
  role: string | null;
};

const UserRole: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Placeholder user data (replace with actual auth data from Supabase)
  const [userName, setUserName] = useState<string>("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Fetch current user data (optional, depends on your auth setup)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setMessage("Failed to log out");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const formatPhilippineDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const { data: usersData, error: usersError } = await supabase
          .from("user")
          .select("user_id, email, name, profilePicture, date_registered, role");

        if (usersError) throw usersError;
        if (!usersData || usersData.length === 0) {
          setUsers([]);
          setIsLoading(false);
          return;
        }

        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setMessage("Failed to load user data");
        setTimeout(() => setMessage(""), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("user")
        .update({ role: newRole || null })
        .eq("user_id", userId);

      if (error) throw error;

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === userId ? { ...user, role: newRole || null } : user
        )
      );
      setMessage("Role updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update role:", error);
      setMessage("Failed to update role");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      (roleFilter === "" || user.role === roleFilter)
  );

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C] p-8">
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
        </div>
      </div>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-5xl mx-auto text-black">
        <MessageNotification message={message} />

        <div className="bg-[#FFFCF9] rounded-lg p-6 mx-auto text-black">
          <h2 className="text-center font-bold text-black text-5xl">USER ROLE MANAGEMENT</h2>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search by email or name"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              {[...new Set(users.map((u) => u.role).filter((role): role is string => role !== null))].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
              <option value="none">None</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl mx-auto border-collapse text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-2 border border-gray-2025 font-semibold text-center">Name</th>
                <th className="p-2 border border-gray-2025 font-semibold text-center">Email</th>
                <th className="p-2 border border-gray-2025 font-semibold text-center">Date Registered</th>
                <th className="p-2 border border-gray-2025 font-semibold text-center">Role</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.user_id}
                    className={`text-gray-900 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-2 border border-gray-2025 text-center truncate max-w-[150px]">{user.name || "Unknown"}</td>
                    <td className="p-2 border border-gray-2025 text-center truncate max-w-[200px]">{user.email}</td>
                    <td className="p-2 border border-gray-2025 text-center max-w-[150px]">
                      {formatPhilippineDateTime(user.date_registered)}
                    </td>
                    <td className="p-2 border border-gray-2025 text-center max-w-[120px]">
                      <select
                        className="w-full p-1 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={user.role || ""}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleRoleChange(user.user_id, e.target.value)}
                        aria-label={`Select role for user ${user.email}`}
                      >
                        <option value="">None</option>
                        <option value="admin">Admin</option>
                        <option value="dean">Dean</option>
                        <option value="student">Student</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserRole;