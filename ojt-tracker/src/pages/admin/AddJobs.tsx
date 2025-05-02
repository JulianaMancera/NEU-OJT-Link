import { useEffect, useState } from "react";
import { fetchCompanies, fetchJobs, updateJob, Job, Company } from "../../services/JobService";
import { JobRow } from "../../components/JobRow";
import AddJobForm from "../../components/AddJobsForm";
import { MessageNotification } from "../../components/MessageNotification";
import Sidebar from "../../components/SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { User, Settings, CircleHelp, LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase";

const AddJobs = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setMessage("❌ Failed to log out");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, jobsData] = await Promise.all([
          fetchCompanies(),
          fetchJobs()
        ]);
        setCompanies(companiesData);
        setJobs(jobsData);
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage("❌ Failed to load data");
        setTimeout(() => setMessage(""), 3000);
      }
    };
    loadData();
  }, []);

  const handleEditToggle = (jobId: number) => {
    setEditMode(editMode === jobId ? null : jobId);
  };

  const handleJobChange = (jobId: number, value: string) => {
    setJobs(jobs.map(j => j.job_id === jobId ? { ...j, position: value } : j));
  };

  const handleCompanyChange = (jobId: number, companyId: string) => {
    setJobs(jobs.map(j => j.job_id === jobId ? { ...j, company_id: companyId } : j));
  };

  const handleSlotChange = (jobId: number, delta: number) => {
    setJobs(jobs.map(j => j.job_id === jobId ? { ...j, slots: Math.max(0, (j.slots ?? 0) + delta) } : j));
  };

  const handleSave = async (job: Job) => {
    try {
      await updateJob(job);
      setMessage("✅ Job updated successfully!");
      setEditMode(null);
      setJobs(await fetchJobs());
    } catch (error) {
      console.error("Error saving job:", error);
      setMessage("❌ Failed to save changes.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleRestrictToggle = async (jobId: number) => {
    const job = jobs.find(j => j.job_id === jobId);
    if (!job) return;

    const newStatus = !job.isAvailable;
    
    try {
      await updateJob({ job_id: jobId, isAvailable: newStatus });
      setMessage(`✅ Job ${newStatus ? "unrestricted" : "restricted"} successfully!`);
      setJobs(await fetchJobs());
    } catch (error) {
      console.error("Error toggling job status:", error);
      setMessage(`❌ Failed to ${newStatus ? "unrestrict" : "restrict"} job`);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="relative min-h-screen w-screen bg-blue-100 p-6">
      {/* Header */}
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
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
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

      <div className="mt-24 bg-white border border-black rounded-lg p-6 max-w-6xl mx-auto">
        <MessageNotification message={message} />
        <div className="mb-4">
          <div className="flex justify-center mb-2">
            <h2 className="text-[1.8rem] font-bold text-black">Add Jobs</h2>
          </div>
          <div className="flex justify-start">
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center w-48 px-4 py-2 rounded border border-black text-black bg-[#90D5FF] hover:bg-blue-200 transition-colors">
              + Add Job
            </button>

            {showForm && (
              <AddJobForm 
                companies={companies}
                onSuccess={() => {
                  fetchJobs().then(setJobs);
                  setMessage("✅ Job added successfully!");
                  setTimeout(() => setMessage(""), 3000);
                }}
                onClose={() => setShowForm(false)}
              />
            )}
          </div>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-12 font-semibold p-2 rounded text-black border-2" style={{ backgroundColor: '#E8E8E8' }}>
          <div className="col-span-3 ml-10">Job</div>
          <div className="col-span-2 ml-16">Slots</div>
          <div className="col-span-3">Company</div>
          <div className="col-span-4 ml-18">Configure</div>
        </div>

        {jobs.map((job) => (
          <JobRow
            key={job.job_id}
            job={job}
            companies={companies}
            editMode={editMode}
            onEditToggle={handleEditToggle}
            onJobChange={handleJobChange}
            onCompanyChange={handleCompanyChange}
            onSlotChange={handleSlotChange}
            onSave={handleSave}
            onRestrictToggle={handleRestrictToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default AddJobs;