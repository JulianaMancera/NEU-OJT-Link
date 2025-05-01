import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "../../components/SideBar";
import { MessageNotification } from "../../components/MessageNotification";
import OJTLogo from "/src/assets/ojt-white.png";

type User = {
  user_id: string;
  name: string;
  email: string;
  date_registered: string;
  role: string;
  profilePicture: string | null;
};

const UserRole = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Function to format date in Philippine time (MM-DD-YY HH:MM AM/PM)
  const formatPhilippineDateTime = (dateString: string) => {
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
          .select("user_id, name, email, date_registered, role, profilePicture");

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

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (roleFilter === "" || user.role === roleFilter)
  );

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C] p-8">
      {/* Header */}
      <div className="w-full h-[80px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-b border-black flex items-center justify-between px-6 z-50">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
      </div>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black">
        <MessageNotification message={message} />

        <div className="flex justify-center py-4">
          <h2 className="text-center font-bold text-black text-5xl">USER ROLE MANAGEMENT</h2>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search by name"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              {[...new Set(users.map((u) => u.role))].map((role) => (
                <option key={role || "none"} value={role}>
                  {role || "None"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/5">User ID</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/5">Name</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/5">Email</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/5">Date Registered</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/5">Role</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.user_id}
                    className={`text-sm text-gray-900 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3 border border-gray-300 text-center truncate">{user.user_id}</td>
                    <td className="p-3 border border-gray-300 text-center">
                      <div className="flex items-center space-x-3 justify-start">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={`${user.name}'s profile`}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {user.name
                              .split(" ")
                              .map((name) => name.charAt(0))
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                        )}
                        <span className="truncate">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-3 border border-gray-300 text-center truncate">{user.email}</td>
                    <td className="p-3 border border-gray-300 text-center">
                      {formatPhilippineDateTime(user.date_registered)}
                    </td>
                    <td className="p-3 border border-gray-300 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "dean"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "student"
                            ? "bg-green-100 text-green-800"
                            : user.role === "faculty"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role || "None"}
                      </span>
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