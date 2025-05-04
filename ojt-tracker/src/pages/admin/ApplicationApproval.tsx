import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { Loading } from "../../components/Loading";
import { Folder, User, Settings, CircleHelp, LogOut, UserCog, ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateAllJobSlots } from "../../services/JobService";

interface Application {
  application_id: string;
  user_id: string;
  company_id: string;
  job_id: string;
  email: string;
  status: 'approved' | 'pending' | 'rejected';
  user_name?: string;
  company_name?: string;
}

const ApplicationApproval = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showModalFor, setShowModalFor] = useState<string|null>(null);
  const [showModalName, setShowModalName] = useState<string|null>(null) 
  const [docsByFolder, setDocsByFolder] = useState<Record<string,string[]>>({});
  const folders = ['com','coverLetter','cv','medCert','notarized','psyTest','resume'];
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([]);
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

  // Fetch applications + enrich with names
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

  const handleViewDocs = async (user_id: string) => {
    const app = applications.find(a => a.user_id === user_id)
    setShowModalName(app?.user_name ?? user_id)
    setShowModalFor(user_id);
    setSelectedFolder(null);
    // clear any previous results
    const out: Record<string,string[]> = {};
  
    await Promise.all(folders.map(async folder => {
      // list everything in this folder
      const { data: files, error: listError } =
        await supabase
          .storage
          .from('applicant-documents')
          .list(folder);
  
      if (listError || !files) {
        out[folder] = [];
        return;
      }
  
      // only keep the files for this user
      const userFiles = files
        .filter(f => f.name.includes(`_${user_id}_`))
        .map(f => {
          // getPublicUrl returns { data: { publicUrl } }
          const { data: { publicUrl } } =
            supabase
              .storage
              .from('applicant-documents')
              .getPublicUrl(`${folder}/${f.name}`);
          return publicUrl;
        });
  
      out[folder] = userFiles;
    }));
  
    setDocsByFolder(out);
  };

  const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      const { error: statusError } = await supabase
        .from("application")
        .update({ status: newStatus })
        .eq('application_id', applicationId);
      if (statusError) throw statusError;

      await updateAllJobSlots();

      const { data: updatedApps, error: fetchError } = await supabase
        .from("application")
        .select("*");
      if (fetchError) throw fetchError;

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
  if (!user) return <p className="text-center mt-10">Please log in to view applications</p>;

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
                      onClick={() => { navigate("/profile"); setProfileOpen(false); }}
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
              <th className="border p-2">Username</th>
              <th className="border p-2">Company Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Status</th>
              {/* ← NEW: Documents col */}
              <th className="border p-2">Documents</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(application => (
              <tr key={application.application_id}
                  className="hover:bg-gray-300 text-black bg-white">
                <td className="border p-2">{application.user_name}</td>
                <td className="border p-2">{application.company_name}</td>
                <td className="border p-2">{application.email}</td>
                <td className="border p-2">
                  <select
                    value={application.status}
                    onChange={e => handleStatusChange(
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
                {/* ← NEW: View Docs button */}
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleViewDocs(application.user_id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    View Docs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Show Modal Documents */}   
        {showModalFor && (
          <div
            className="fixed inset-0 bg-gradient-to-b from-[#5F74C9] to-[#0A279C] backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModalFor(null)}
          >
            <div
              className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-2xl relative overflow-y-auto max-h-[80vh] shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title"
              aria-modal="true"
            >
              <h3 id="modal-title" className="text-2xl text-gray-600 font-bold mb-4">
                Documents for <span className="font-arial">{showModalName}</span>
              </h3>
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-black p-2 hover:bg-gray-100 rounded-full"
                onClick={() => setShowModalFor(null)}
                aria-label="Close modal"
              >
                ✕
              </button>

              {/* STEP 1: show 7 folder icons */}
              {!selectedFolder ? (
                <div className="grid grid-cols-4 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedFolder(folder)}
                      tabIndex={0}
                      className={`cursor-pointer p-4 rounded text-center transition-colors duration-200 ${selectedFolder === folder ? "bg-gray-100" : "hover:bg-gray-50"} focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300`}
                    >
                      <Folder className="w-12 h-12 mx-auto text-gray-600" />
                      <p className="mt-2 text-gray-600 capitalize">{folder}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* STEP 2: show files in selectedFolder */}
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to folders</span>
                  </button>
                  <h4 className="text-lg font-medium mb-2 capitalize">{selectedFolder}</h4>
                  {docsByFolder[selectedFolder]?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700">
                            <th className="border p-2 text-left font-semibold">File Name</th>
                            <th className="border p-2 text-center font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docsByFolder[selectedFolder].map((url, i) => {
                            const filename = url.split('/').pop() || url; // Extract the filename from the URL
                            return (
                              <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="border p-2 text-black truncate max-w-xs">
                                  <span className="text-gray-500 mr-2">📄</span>
                                  {filename.length > 30 ? `${filename.substring(0, 30)}...` : filename} {/* Truncate if too long */}
                                </td>
                                <td className="border border-solid border-black p-2 text-center">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    View
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Folder className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-500 italic">No files found in this folder.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
    </div>
  </div>
);
};

export default ApplicationApproval;