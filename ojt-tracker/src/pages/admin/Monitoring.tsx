import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "./SideBar";
import { MessageNotification } from "../../components/MessageNotification";
import OJTLogo from "/src/assets/ojt-white.png";
import { User, Settings, CircleHelp, LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Application = {
  application_id: number;
  user_id: string;
  job_id: number;
  company_id: string;
  status: string;
  date_applied: string;
};

type Monitoring = Application & {
  userName: string;
  profilePicture: string | null;
  companyName: string;
  jobPosition: string;
  hoursCompleted: number;
  hoursLeft: number;
  lastReportDate: string | null;
  status: "Active" | "Inactive" | "No Reports";
};

const Monitoring = () => {
  const [applications, setApplications] = useState<Monitoring[]>([]);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Placeholder user data (replace with actual auth data from Supabase)
  const [userName, setUserName] = useState<string>("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Fetch current user data
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
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setMessage("Failed to log out");
      setTimeout(() => setMessage(""), 3000);
    }
  };

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

  // Function to check if a date is within the past week
  const isWithinPastWeek = (dateString: string) => {
    const reportDate = new Date(dateString);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return reportDate >= oneWeekAgo;
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const { data: rawApps, error: appsError } = await supabase
          .from("application")
          .select("*")
          .eq("status", "approved");

        if (appsError) throw appsError;
        if (!rawApps || rawApps.length === 0) {
          setApplications([]);
          setIsLoading(false);
          return;
        }

        const userIds = rawApps.map((app) => app.user_id);
        const companyIds = [...new Set(rawApps.map((app) => app.company_id))];
        const jobIds = [...new Set(rawApps.map((app) => app.job_id))];

        // Fetch users
        const { data: usersData } = await supabase
          .from("user")
          .select("user_id, name, profilePicture")
          .in("user_id", userIds);

        // Fetch companies
        const { data: companiesData } = await supabase
          .from("company")
          .select("company_id, name")
          .in("company_id", companyIds);

        // Fetch jobs
        const { data: jobsData } = await supabase
          .from("job")
          .select("job_id, position")
          .in("job_id", jobIds);

        // Fetch hours logs with timestamps
        const { data: hoursLogsData } = await supabase
          .from("hours_logs")
          .select("user_id, hours, logged_at")
          .in("user_id", userIds)
          .order("logged_at", { ascending: false });

        // Process applications
        const monitoring = rawApps.map((app) => {
          const user = usersData?.find((u) => u.user_id === app.user_id);
          const company = companiesData?.find((c) => c.company_id === app.company_id);
          const job = jobsData?.find((j) => j.job_id === app.job_id);

          const userHoursLogs = hoursLogsData?.filter((log) => log.user_id === app.user_id) || [];
          const hoursCompleted = userHoursLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
          const hoursLeft = Math.max(0, 300 - hoursCompleted);
          const latestLog = userHoursLogs[0];
          const lastReportDate = latestLog?.logged_at || null;

          // Determine status
          let status: "Active" | "Inactive" | "No Reports" = "No Reports";
          if (lastReportDate) {
            status = isWithinPastWeek(lastReportDate) ? "Active" : "Inactive";
          }

          return {
            ...app,
            userName: user?.name || "Unknown",
            profilePicture: user?.profilePicture || null,
            companyName: company?.name || "Unknown",
            jobPosition: job?.position || "Unknown",
            hoursCompleted,
            hoursLeft,
            lastReportDate,
            status,
          };
        });

        setApplications(monitoring);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        setMessage("Failed to load application data");
        setTimeout(() => setMessage(""), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(
    (app) =>
      app.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (companyFilter === "" || app.companyName === companyFilter)
  );

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C] p-8">
      {/* Header */}
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
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden mb-

3 border-4 border-blue-300">
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
        </div>
      </div>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black">
        <MessageNotification message={message} />

        <div className="flex justify-center py-4 ">
          <h2 className="text-center font-bold text-black text-5xl">MONITORING</h2>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by username..."
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search by username"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              aria-label="Filter by company"
            >
              <option value="">All Companies</option>
              {[...new Set(applications.map((a) => a.companyName))].map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/6">Name</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/5">Company</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/6">Position</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/8">Hours Required</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/8">Hours Left</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/8">Status</th>
                <th className="p-3 border border-gray-300 text-sm font-semibold text-center w-1/8">Last Report</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No applications match your filters.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => (
                  <tr
                    key={app.application_id}
                    className={`text-sm text-gray-900 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3 border border-gray-300 text-center">
                      <div className="flex items-center space-x-3 justify-start">
                        {app.profilePicture ? (
                          <img
                            src={app.profilePicture}
                            alt={`${app.userName}'s profile`}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {app.userName
                              .split(" ")
                              .map((name) => name.charAt(0))
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                        )}
                        <span className="truncate">{app.userName}</span>
                      </div>
                    </td>
                    <td className="p-3 border border-gray-300 text-center truncate">{app.companyName}</td>
                    <td className="p-3 border border-gray-300 text-center truncate">{app.jobPosition}</td>
                    <td className="p-3 border border-gray-300 text-center">300 hours</td>
                    <td className="p-3 border border-gray-300 text-center">{app.hoursLeft} hours</td>
                    <td className="p-3 border border-gray-300 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : app.status === "Inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 border border-gray-300 text-center">
                      {app.lastReportDate
                        ? formatPhilippineDateTime(app.lastReportDate)
                        : "No submitted report"}
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

export default Monitoring;