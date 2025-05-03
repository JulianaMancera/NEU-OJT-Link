import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { Loading } from "../../components/Loading";
import { User, Settings, CircleHelp, LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateAllJobSlots } from "../../services/JobService";

interface Application {
  application_id: string;
  user_id: string;
  company_id: string;
  job_id: string;
  email: string;
  status: 'approved' | 'pending' | 'rejected';
}

const ApplicationApproval = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [applications, setApplications] = useState<(Application & { 
    user_name?: string; 
    company_name?: string;
  })[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // User profile data
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
      navigate("/"); // Updated to navigate to root path, consistent with Admin
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const fetchApplications = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Authentication error:", userError);
        setLoading(false);
        return;
      }

      setUser(user);

      const { data, error } = await supabase.from("application").select("*");

      if (error) {
        console.error("Error fetching applications:", error.message);
        setLoading(false);
        return;
      }

      const fetchNames = await Promise.all(data.map(async (app) => {
        const { data: userData } = await supabase
          .from("user")
          .select("name")
          .eq("user_id", app.user_id)
          .single();

        const { data: companyData } = await supabase
          .from("company")
          .select("name")
          .eq("company_id", app.company_id)
          .single();

        return {
          ...app,
          user_name: userData?.name || 'Unknown',
          company_name: companyData?.name || 'Unknown'
        };
      }));

      setApplications(fetchNames);
      setLoading(false);
    };

    fetchApplications();
  }, []);

  const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      const application = applications.find(app => app.application_id === applicationId);
      if (!application) return;
      
      // Update application status in Supabase
      const { error: statusError } = await supabase
        .from("application")
        .update({ status: newStatus })
        .eq('application_id', applicationId);

      if (statusError) throw statusError;

      // Update job slots in Supabase
      await updateAllJobSlots();

      // Refresh local applications data
      const { data: updatedApps, error: fetchError } = await supabase
        .from("application")
        .select("*");

      if (fetchError) throw fetchError;

      // Update user and company names
      const updatedWithNames = await Promise.all(updatedApps.map(async (app) => {
        const { data: userData } = await supabase
          .from("user")
          .select("name")
          .eq("user_id", app.user_id)
          .single();

        const { data: companyData } = await supabase
          .from("company")
          .select("name")
          .eq("company_id", app.company_id)
          .single();

        return {
          ...app,
          user_name: userData?.name || 'Unknown',
          company_name: companyData?.name || 'Unknown'
        };
      }));

      setApplications(updatedWithNames);
    } catch (error) {
      console.error("Error updating application:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (!user) {
    return <p className="text-center mt-10">Please log in to view applications</p>;
  }

  return (
    <div>
      <div className="bg-blue-200 w-screen relative min-h-screen p-20">
        <div className="w-full h-[80px] fixed absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
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
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
        <h2 className="text-[2.3rem] font-bold text-center mb-10 mt-12 text-black">
          Application Approvals
        </h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-black">
              <th className="border p-2">Application ID</th>
              <th className="border p-2">Username</th>
              <th className="border p-2">Company Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.application_id} className="hover:bg-gray-300 text-black bg-white">
                <td className="border p-2">{application.application_id}</td>
                <td className="border p-2">{application.user_name}</td>
                <td className="border p-2">{application.company_name}</td>
                <td className="border p-2">{application.email}</td>
                <td className="border p-2">
                  <select
                    value={application.status}
                    onChange={(e) => handleStatusChange(
                      application.application_id, 
                      e.target.value as Application['status']
                    )}
                    className="w-full p-1 font-semibold"
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationApproval;