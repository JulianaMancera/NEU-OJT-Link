import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { Loading } from "../../components/Loading";
import { Folder, User, LogOut, UserCog, Filter, Search} from "lucide-react";
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
  const [showModalName, setShowModalName] = useState<string|null>(null);
  const [docsByFolder, setDocsByFolder] = useState<Record<string,string[]>>({});
  const folders = ['com','coverLetter','cv','medCert','notarized','psyTest','resume','endorsement-letter'];
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string>("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

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
      setFilteredApplications(fetchNames);
      setLoading(false);
    };

    fetchApplications();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...applications];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(application => application.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(application => 
        application.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredApplications(filtered);
  }, [statusFilter, applications, searchTerm]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleViewDocs = async (user_id: string) => {
    const app = applications.find(a => a.user_id === user_id);
    setShowModalName(app?.user_name ?? user_id);
    setShowModalFor(user_id);
    setSelectedFolder(null);
    const out: Record<string,string[]> = {};
  
    await Promise.all(folders.map(async (folder) => {
      // endorsement‑letter lives in endorsement‑letter/{userId}
      if (folder === 'endorsement-letter') {
        const path = `endorsement-letter/${user_id}`;
        const { data: files, error: listError } = await supabase
          .storage
          .from('applicant-documents')
          .list(path);
  
        if (listError || !files) {
          out[folder] = [];
          return;
        }
  
        // everything in that folder is theirs, so just map to publicUrl
        out[folder] = files.map((f) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('applicant-documents')
            .getPublicUrl(`${path}/${f.name}`);
          return publicUrl;
        });
  
        return;
      }
  
      // ——————————————————————————————
      // otherwise, your flat buckets (cv, com, etc.) are unchanged
      const { data: files, error: listError } = await supabase
        .storage
        .from('applicant-documents')
        .list(folder);
  
      if (listError || !files) {
        out[folder] = [];
        return;
      }
  
      // filter only this user’s files by your existing naming convention
      out[folder] = files
        .filter((f) => f.name.includes(`_${user_id}_`))
        .map((f) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('applicant-documents')
            .getPublicUrl(`${folder}/${f.name}`);
          return publicUrl;
        });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) return <Loading />;
  if (!user) return <p className="text-center mt-10">Please log in to view applications</p>;

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C] p-8">
        {/* Header */}
        <div className="w-full h-[80px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-black flex items-center justify-between px-6 z-10">
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

      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black shadow-lg">
        <h2 className="text-center justify-center py-4 font-bold text-5xl mb-6">
          Application Approvals
        </h2>

        <div className="bg-gray-50 p-4 rounded-lg mb-6 shadow-sm border flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-gray-500" />
            <label htmlFor="status-filter" className="font-medium">Filter by Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse shadow-sm">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-left">Company Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Documents</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application, idx) => (
                    <tr
                      key={application.application_id}
                      className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="p-3">{application.user_name}</td>
                      <td className="p-3">{application.company_name}</td>
                      <td className="p-3">{application.email}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {application.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleViewDocs(application.user_id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
                        >
                          <Folder size={16} /> View Docs
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={application.status}
                          onChange={e => handleStatusChange(
                            application.application_id,
                            e.target.value as Application['status']
                          )}
                          className="border p-2 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                          disabled={loading}
                        >
                          <option value="pending">Set Pending</option>
                          <option value="approved">Set Approved</option>
                          <option value="rejected">Set Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredApplications.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-gray-500"
                      >
                        No applications found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
              <div>
                Showing {filteredApplications.length} applications
                {statusFilter !== 'all' && ` with status "${statusFilter}"`}
              </div>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          </>
        )}
      </div>

       {/* Documents Modal */}
       {showModalFor && (
        <div className="fixed inset-0 bg-gradient-to-b from-[#3657DB] from-24% to-[#8D95B5] to-98% bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowModalFor(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl relative overflow-y-auto max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Documents for {showModalName}
            </h3>
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
              onClick={() => setShowModalFor(null)}
            >
              ✕
            </button>

              {/* STEP 1: show 7 folder icons */}
              {!selectedFolder ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {folders.map(folder => (
                  <div
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className="cursor-pointer hover:bg-blue-50 p-4 rounded-lg text-center border transition-all duration-200"
                  >
                    <Folder className="w-12 h-12 mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-700 capitalize font-medium">{folder}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* STEP 2: show files in selectedFolder */}
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to folders
                </button>
                <h4 className="text-lg font-medium mb-2 capitalize text-gray-700">
                  {selectedFolder} Files
                </h4>
                {docsByFolder[selectedFolder]?.length ? (
                  <ul className="space-y-2 mt-4">
                    {docsByFolder[selectedFolder].map((url, i) => (
                      <li key={i} className="flex items-center p-2 hover:bg-gray-50 rounded-lg border">
                        <span className="text-xl mr-2">📄</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex-grow"
                        >
                          {url.split("/").pop()}
                        </a>
                        <a
                          href={url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                        >
                          Download
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-center">No files found in this folder</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationApproval;
