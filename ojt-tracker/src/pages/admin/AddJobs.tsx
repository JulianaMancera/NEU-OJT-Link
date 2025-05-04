import { useEffect, useState } from "react";
import { fetchCompanies, fetchJobs, updateJob, Job, Company } from "../../services/JobService";
import AddJobForm from "../../components/AddJobsForm";
import { MessageNotification } from "../../components/MessageNotification";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { Search, Filter, Plus, X, Save, Edit, AlertTriangle, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase";

const AddJobs = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [companiesData, jobsData, { data: { user } }] = await Promise.all([
          fetchCompanies(),
          fetchJobs(),
          supabase.auth.getUser(),
        ]);
        setCompanies(companiesData);
        setJobs(jobsData);
        setFilteredJobs(jobsData);

        // Fetch user profile data
        if (user) {
          setUserName(user.user_metadata?.full_name || "User");
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
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage("❌ Failed to load data");
        setTimeout(() => setMessage(""), 3000);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  });

  const applyFilters = () => {
    let filtered = [...jobs];

    // Apply availability filter
    if (statusFilter !== "all") {
      const isAvailable = statusFilter === "available";
      filtered = filtered.filter((job) => job.isAvailable === isAvailable);
    }

    // Apply search term if any
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          companies
            .find((c) => c.company_id === job.company_id)
            ?.name.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const handleEditToggle = (jobId: number) => {
    setEditMode(editMode === jobId ? null : jobId);
  };

  const handleJobChange = (jobId: number, value: string) => {
    setJobs(jobs.map((j) => (j.job_id === jobId ? { ...j, position: value } : j)));
    setFilteredJobs(filteredJobs.map((j) => (j.job_id === jobId ? { ...j, position: value } : j)));
  };

  const handleCompanyChange = (jobId: number, companyId: string) => {
    setJobs(jobs.map((j) => (j.job_id === jobId ? { ...j, company_id: companyId } : j)));
    setFilteredJobs(filteredJobs.map((j) => (j.job_id === jobId ? { ...j, company_id: companyId } : j)));
  };

  const handleSlotChange = (jobId: number, delta: number) => {
    const updateJobsList = (list: Job[]) =>
      list.map((j) => {
        if (j.job_id === jobId) {
          const newTotalSlots = Math.max(0, (j.total_slots || 0) + delta);
          const approvedCount = j.approved_application_count || 0;
          const newAvailableSlots = Math.max(0, newTotalSlots - approvedCount);

          return {
            ...j,
            total_slots: newTotalSlots,
            slots: newAvailableSlots,
          };
        }
        return j;
      });

    setJobs(updateJobsList(jobs));
    setFilteredJobs(updateJobsList(filteredJobs));
  };

  const handleSave = async (job: Job) => {
    try {
      if (!job.position || !job.company_id) {
        setMessage("❌ Position and company cannot be empty");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      setLoading(true);
      await updateJob({
        ...job,
        slots: job.total_slots - (job.approved_application_count || 0),
      });

      setMessage("✅ Job updated successfully!");
      setEditMode(null);
      const jobsData = await fetchJobs();
      setJobs(jobsData);
      setFilteredJobs(jobsData);
    } catch (error) {
      console.error("Error saving job:", error);
      setMessage("❌ Failed to save changes.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRestrictToggle = async (jobId: number) => {
    const job = jobs.find((j) => j.job_id === jobId);
    if (!job) return;

    const newStatus = !job.isAvailable;

    try {
      setLoading(true);
      await updateJob({
        job_id: jobId,
        isAvailable: newStatus,
      });
      setMessage(`✅ Job ${newStatus ? "unrestricted" : "restricted"} successfully!`);

      const updateJobsList = (list: Job[]) =>
        list.map((j) => (j.job_id === jobId ? { ...j, isAvailable: newStatus } : j));

      setJobs(updateJobsList(jobs));
      setFilteredJobs(updateJobsList(filteredJobs));
    } catch (error) {
      console.error("Error toggling job status:", error);
      setMessage(`❌ Failed to ${newStatus ? "unrestrict" : "restrict"} job`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (isAvailable: boolean) => {
    if (isAvailable) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
          Available
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
        Restricted
      </span>
    );
  };

  const getCompanyName = (companyId: string) => {
    return companies.find((c) => c.company_id === companyId)?.name || "Unknown Company";
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C] p-8">
      {/* Header */}
      <div className="w-full h-[80px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-black flex items-center justify-between px-6">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
        <div className="flex items-center">
          {/* Profile Section */}
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
            <div className="absolute right-6 top-[4.5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem]">
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

      <div className="pt-24 pb-10 px-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-6xl mx-auto">
          <div className="p-6">
            {message && <MessageNotification message={message} />}

            <div className="flex justify-center items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Job Management</h2>
            </div>

            {/* Action bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center px-4 py-2 rounded-md border border-transparent text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto"
              >
                <Plus size={18} className="mr-2" />
                Add New Job
              </button>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search jobs or companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter size={16} className="text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-black"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              </div>
            </div>

            {showForm && (
              <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-black">Add New Job</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                <AddJobForm
                  companies={companies}
                  onSuccess={() => {
                    fetchJobs().then((data) => {
                      setJobs(data);
                      setFilteredJobs(data);
                    });
                    setMessage("✅ Job added successfully!");
                    setShowForm(false);
                    setTimeout(() => setMessage(""), 3000);
                  }}
                  onClose={() => setShowForm(false)}
                />
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="p-3 text-center font-semibold">Job Position</th>
                        <th className="p-3 text-center font-semibold">Company</th>
                        <th className="p-3 text-center font-semibold">Available Slots</th>
                        <th className="p-3 text-center font-semibold">Total Slots</th>
                        <th className="p-3 text-center font-semibold">Status</th>
                        <th className="p-3 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.length > 0 ? (
                        filteredJobs.map((job, idx) => (
                          <tr
                            key={job.job_id}
                            className={`border-b hover:bg-gray-50 text-black ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                          >
                            <td className="p-3">
                              {editMode === job.job_id ? (
                                <input
                                  type="text"
                                  value={job.position}
                                  onChange={(e) => handleJobChange(job.job_id, e.target.value)}
                                  className="w-full border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                />
                              ) : (
                                <div className="font-medium text-black">{job.position}</div>
                              )}
                            </td>
                            <td className="p-3">
                              {editMode === job.job_id ? (
                                <select
                                  value={job.company_id}
                                  onChange={(e) => handleCompanyChange(job.job_id, e.target.value)}
                                  className="w-full border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                >
                                  {companies.map((company) => (
                                    <option key={company.company_id} value={company.company_id}>
                                      {company.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                getCompanyName(job.company_id)
                              )}
                            </td>
                            <td className="p-3 text-center text-black">
                              <span className={`${job.slots === 0 ? "text-red-600 font-bold" : ""}`}>
                                {job.slots || 0}
                              </span>
                            </td>
                            <td className="p-3 text-center text-black">
                              {editMode === job.job_id ? (
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => handleSlotChange(job.job_id, -1)}
                                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-l"
                                    disabled={(job.total_slots || 0) <= 0}
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-1 border-t border-b min-w-8 inline-block text-center">
                                    {job.total_slots || 0}
                                  </span>
                                  <button
                                    onClick={() => handleSlotChange(job.job_id, 1)}
                                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-r"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                job.total_slots || 0
                              )}
                            </td>
                            <td className="p-3 text-center">{getStatusBadge(job.isAvailable)}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {editMode === job.job_id ? (
                                  <>
                                    <button
                                      onClick={() => handleSave(job)}
                                      className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                    >
                                      <Save size={14} className="mr-1" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditMode(null)}
                                      className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                      <X size={14} className="mr-1" />
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditToggle(job.job_id)}
                                      className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                    >
                                      <Edit size={14} className="mr-1" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleRestrictToggle(job.job_id)}
                                      className={`flex items-center px-3 py-1 rounded-md text-white transition-colors ${
                                        job.isAvailable
                                          ? "bg-red-500 hover:bg-red-600"
                                          : "bg-green-500 hover:bg-green-600"
                                      }`}
                                    >
                                      <AlertTriangle size={14} className="mr-1" />
                                      {job.isAvailable ? "Restrict" : "Unrestrict"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-black">
                            {searchTerm || statusFilter !== "all" ? (
                              <div className="flex flex-col items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-12 w-12 text-gray-400 mb-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                                <p>No jobs found matching your search criteria.</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-12 w-12 text-gray-400 mb-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0h10a2 2 0 012 2v2H7a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2H5z"
                                  />
                                </svg>
                                <p>No jobs have been added yet.</p>
                                <button
                                  onClick={() => setShowForm(true)}
                                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Add Your First Job
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer & Summary */}
                <div className="mt-4 text-sm text-black flex items-center justify-between flex-wrap gap-2">
                  <div>
                    Showing {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
                    {statusFilter !== "all" && ` with status "${statusFilter}"`}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </div>
                  {(statusFilter !== "all" || searchTerm) && (
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setSearchTerm("");
                      }}
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <X size={14} className="mr-1" />
                      Clear all filters
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddJobs;