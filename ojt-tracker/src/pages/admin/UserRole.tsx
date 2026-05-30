import { useEffect, useState, ChangeEvent } from "react";
import { supabase } from "../../../supabase";
import AdminLayout from "./AdminLayout";
import { MessageNotification } from "../../components/MessageNotification";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

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
        setUsers(usersData || []);
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

      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole || null } : u))
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
    <AdminLayout>
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
              {[...new Set(users.map((u) => u.role).filter((r): r is string => r !== null))].map(
                (role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                )
              )}
              <option value="none">None</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl mx-auto border-collapse text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-2 border border-gray-300 font-semibold text-center">Name</th>
                <th className="p-2 border border-gray-300 font-semibold text-center">Email</th>
                <th className="p-2 border border-gray-300 font-semibold text-center">Date Registered</th>
                <th className="p-2 border border-gray-300 font-semibold text-center">Role</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
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
                    <td className="p-2 border border-gray-300 text-center truncate max-w-[150px]">
                      {user.name || "Unknown"}
                    </td>
                    <td className="p-2 border border-gray-300 text-center truncate max-w-[200px]">
                      {user.email}
                    </td>
                    <td className="p-2 border border-gray-300 text-center max-w-[150px]">
                      {formatPhilippineDateTime(user.date_registered)}
                    </td>
                    <td className="p-2 border border-gray-300 text-center max-w-[120px]">
                      <select
                        className="w-full p-1 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={user.role || ""}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          handleRoleChange(user.user_id, e.target.value)
                        }
                        aria-label={`Select role for ${user.email}`}
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
    </AdminLayout>
  );
};

export default UserRole;
