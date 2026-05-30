import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  LogOut,
  Info,
  Users,
  Briefcase,
  Building2,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  UserCog,
} from "lucide-react";
import { supabase } from "../../../supabase";
import OJTLogo from "/src/assets/ojt-white.png";
import Sidebar from "./SideBar";

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  pendingApplications: number;
  activeStudents: number;
}

interface RecentActivity {
  application_id: string;
  user_name: string;
  company_name: string;
  status: "approved" | "pending" | "rejected";
  date_applied: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCompanies: 0,
    pendingApplications: 0,
    activeStudents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
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

    const fetchDashboardData = async () => {
      setLoadingStats(true);
      try {
        const [
          { count: userCount },
          { count: companyCount },
          { count: pendingCount },
          { count: activeCount },
        ] = await Promise.all([
          supabase.from("user").select("*", { count: "exact", head: true }),
          supabase.from("company").select("*", { count: "exact", head: true }),
          supabase
            .from("application")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("application")
            .select("*", { count: "exact", head: true })
            .eq("status", "approved"),
        ]);

        setStats({
          totalUsers: userCount ?? 0,
          totalCompanies: companyCount ?? 0,
          pendingApplications: pendingCount ?? 0,
          activeStudents: activeCount ?? 0,
        });

        const { data: applications } = await supabase
          .from("application")
          .select("application_id, user_id, company_id, status, date_applied")
          .order("date_applied", { ascending: false })
          .limit(6);

        if (applications && applications.length > 0) {
          const userIds = [...new Set(applications.map((a) => a.user_id))];
          const companyIds = [...new Set(applications.map((a) => a.company_id))];

          const [{ data: users }, { data: companies }] = await Promise.all([
            supabase.from("user").select("user_id, name").in("user_id", userIds),
            supabase.from("company").select("company_id, name").in("company_id", companyIds),
          ]);

          const userMap = Object.fromEntries((users ?? []).map((u) => [u.user_id, u.name]));
          const companyMap = Object.fromEntries(
            (companies ?? []).map((c) => [c.company_id, c.name])
          );

          setRecentActivity(
            applications.map((a) => ({
              application_id: a.application_id,
              user_name: userMap[a.user_id] || "Unknown",
              company_name: companyMap[a.company_id] || "Unknown",
              status: a.status,
              date_applied: a.date_applied,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserData();
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isExploreJobsPage = location.pathname === "/explore-jobs";

  const statusConfig = {
    approved: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Approved",
    },
    pending: {
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      label: "Pending",
    },
    rejected: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-100",
      label: "Rejected",
    },
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      iconColor: "text-blue-600",
      route: "/user-role",
    },
    {
      label: "Companies",
      value: stats.totalCompanies,
      icon: Building2,
      color: "from-green-50 to-green-100",
      border: "border-green-200",
      iconColor: "text-green-600",
      route: "/company",
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications,
      icon: ClipboardList,
      color: "from-yellow-50 to-yellow-100",
      border: "border-yellow-200",
      iconColor: "text-yellow-600",
      route: "/application-approval",
    },
    {
      label: "Active Students",
      value: stats.activeStudents,
      icon: TrendingUp,
      color: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      iconColor: "text-purple-600",
      route: "/monitoring",
    },
  ];

  const quickActions = [
    {
      title: "Manage Users",
      description: "View and edit user profiles, roles, and permissions.",
      icon: Users,
      color: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      route: "/user-role",
    },
    {
      title: "Explore Jobs",
      description: "Review and manage job postings across companies.",
      icon: Briefcase,
      color: "from-green-50 to-green-100",
      border: "border-green-200",
      route: "/view-dashboard",
    },
    {
      title: "Companies",
      description: "Manage company profiles and their job listings.",
      icon: Building2,
      color: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      route: "/company",
    },
    {
      title: "Applications",
      description: "Review, approve, or reject student applications.",
      icon: ClipboardList,
      color: "from-orange-50 to-orange-100",
      border: "border-orange-200",
      route: "/application-approval",
    },
    {
      title: "Monitoring",
      description: "Track student OJT progress and completion hours.",
      icon: TrendingUp,
      color: "from-teal-50 to-teal-100",
      border: "border-teal-200",
      route: "/monitoring",
    },
    {
      title: "Reports",
      description: "View weekly and monthly student reports.",
      icon: ClipboardList,
      color: "from-pink-50 to-pink-100",
      border: "border-pink-200",
      route: "/reports",
    },
  ];

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Topbar */}
      <header className="fixed top-0 h-[80px] left-0 w-full bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center space-x-4">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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
      </header>

      {/* Main content */}
      <div className={`flex-1 pt-24 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Welcome banner */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#2B4764] mb-2">Welcome back, {userName}!</h2>
          <p className="text-gray-600 text-lg">
            Here's an overview of the platform. Select a section to get started.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, border, iconColor, route }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className={`bg-gradient-to-br ${color} p-5 rounded-xl shadow hover:shadow-md border ${border} transition-all duration-300 text-left`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-7 h-7 ${iconColor}`} />
                {loadingStats ? (
                  <div className="animate-pulse h-8 w-10 bg-gray-200 rounded" />
                ) : (
                  <span className="text-3xl font-bold text-[#2B4764]">{value}</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-600">{label}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-gray-200">
            <h3 className="text-xl font-semibold text-[#2B4764] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map(({ title, description, icon: Icon, color, border, route }) => (
                <button
                  key={title}
                  onClick={() => navigate(route)}
                  className={`bg-gradient-to-br ${color} p-5 rounded-lg shadow hover:shadow-md border ${border} transition-all duration-300 text-left flex items-start gap-3`}
                >
                  <Icon className="w-6 h-6 mt-0.5 text-[#2B4764] shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[#2B4764] text-sm">{title}</h4>
                    <p className="text-gray-500 text-xs mt-1">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#2B4764]">Recent Applications</h3>
              <button
                onClick={() => navigate("/application-approval")}
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>

            {loadingStats ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No recent applications.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((item) => {
                  const cfg = statusConfig[item.status] ?? statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <li key={item.application_id} className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full ${cfg.bg} shrink-0 mt-0.5`}>
                        <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {item.user_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.company_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(item.date_applied)}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} shrink-0`}
                      >
                        {cfg.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
