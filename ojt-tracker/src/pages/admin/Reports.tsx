import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { User, Settings, CircleHelp, LogOut, UserCog, Filter, FileText, Calendar, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WeeklyReport {
  weekly_report_id: string;
  submitted_by: string;
  start_date: string;
  end_date: string | null;
  week_number: number;
  status: string;
  file_name: string;
  file_url: string;
  total_hours: number;
}

interface MonthlyReport {
  monthly_report_id: string;
  month: number | null;
  year: number | null;
  status: string;
  hours_rendered: number | null;
  submitted_by: string;
  file_name: string;
  file_url: string;
}

const Reports = () => {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [filteredWeeklyReports, setFilteredWeeklyReports] = useState<WeeklyReport[]>([]);
  const [filteredMonthlyReports, setFilteredMonthlyReports] = useState<MonthlyReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    }
  };

  useEffect(() => {
    if (view === 'weekly') fetchWeeklyReports();
    else fetchMonthlyReports();
  }, [view]);

  // Apply filters whenever status filter or data changes
  useEffect(() => {
    applyFilters();
  }, [statusFilter, weeklyReports, monthlyReports, searchTerm]);

  
  const applyFilters = () => {
    // Filter weekly reports
    let filteredWeekly = [...weeklyReports];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filteredWeekly = filteredWeekly.filter(report => report.status === statusFilter);
    }
    
    // Apply search term if any
    if (searchTerm) {
      filteredWeekly = filteredWeekly.filter(report => 
        report.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.week_number.toString().includes(searchTerm)
      );
    }
    
    setFilteredWeeklyReports(filteredWeekly);

    // Filter monthly reports
    let filteredMonthly = [...monthlyReports];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filteredMonthly = filteredMonthly.filter(report => report.status === statusFilter);
    }
    
    // Apply search term if any
    if (searchTerm) {
      filteredMonthly = filteredMonthly.filter(report => 
        report.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.month && report.month.toString().includes(searchTerm)) ||
        (report.year && report.year.toString().includes(searchTerm))
      );
    }
    
    setFilteredMonthlyReports(filteredMonthly);
  };

  const fetchWeeklyReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('weekly_report')
      .select('*');
    if (error) console.error('Error fetching weekly reports:', error.message);
    else {
      setWeeklyReports(data || []);
      setFilteredWeeklyReports(data || []);
    }
    setLoading(false);
  };

  const fetchMonthlyReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('monthly_report')
      .select('*');
    if (error) console.error('Error fetching monthly reports:', error.message);
    else {
      setMonthlyReports(data || []);
      setFilteredMonthlyReports(data || []);
    }
    setLoading(false);
  };

  const handleWeeklyStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('weekly_report')
      .update({ status: newStatus })
      .eq('weekly_report_id', id);
    if (error) console.error('Error updating weekly status:', error.message);
    else {
      setWeeklyReports(prev =>
        prev.map(r => (r.weekly_report_id === id ? { ...r, status: newStatus } : r))
      );
    }
    setLoading(false);
  };

  const handleMonthlyStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('monthly_report')
      .update({ status: newStatus })
      .eq('monthly_report_id', id);
    if (error) console.error('Error updating monthly status:', error.message);
    else {
      setMonthlyReports(prev =>
        prev.map(r => (r.monthly_report_id === id ? { ...r, status: newStatus } : r))
      );
    }
    setLoading(false);
  };

  const navigateToWeeklyJournals = () => {
    navigate("/weekly-journals");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "revise":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C] p-8">
      {/* Header */}
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-black flex items-center justify-between px-6">
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
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black shadow-lg">
        <h2 className="text-center justify-center py-4 font-bold text-5xl mb-6">Reports Management</h2>

        {/* Top Action Bar - Centered Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
          {/* View Toggle and Journal Buttons */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setView('weekly')}
              className={`px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm ${
                view === 'weekly' 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              <Calendar size={18} />
              Weekly Reports
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm ${
                view === 'monthly' 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              <Calendar size={18} />
              Monthly Reports
            </button>
            <button
              onClick={navigateToWeeklyJournals}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all flex items-center gap-2 shadow-md"
            >
              <FileText size={18} />
              Weekly Journals
            </button>
          </div>
        </div>

        {/* Search and Filtering Options */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 shadow-sm border flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-gray-500" />
            <label htmlFor="status-filter" className="font-medium">Filter by Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="revise">Revise</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse shadow-sm">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    {view === 'weekly' ? (
                      <>
                        <th className="p-3 text-left">Submitted By</th>
                        <th className="p-3 text-left">Start Date</th>
                        <th className="p-3 text-left">End Date</th>
                        <th className="p-3 text-center">Week #</th>
                        <th className="p-3 text-center">Total Hours</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">File</th>
                        <th className="p-3 text-center">Action</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3 text-left">Submitted By</th>
                        <th className="p-3 text-center">Month</th>
                        <th className="p-3 text-center">Year</th>
                        <th className="p-3 text-center">Hours Rendered</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">File</th>
                        <th className="p-3 text-center">Action</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {view === 'weekly'
                    ? (filteredWeeklyReports.length > 0 ? filteredWeeklyReports : []).map((report, index) => (
                        <tr 
                          key={report.weekly_report_id} 
                          className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="p-3">{report.submitted_by}</td>
                          <td className="p-3">{new Date(report.start_date).toLocaleDateString()}</td>
                          <td className="p-3">{report.end_date ? new Date(report.end_date).toLocaleDateString() : '-'}</td>
                          <td className="p-3 text-center">{report.week_number}</td>
                          <td className="p-3 text-center">{report.total_hours}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <a 
                              href={report.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline flex items-center justify-center gap-1"
                            >
                              <FileText size={14} />
                              {report.file_name.length > 15 ? `${report.file_name.substring(0, 12)}...` : report.file_name}
                            </a>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={report.status}
                              onChange={(e) => handleWeeklyStatusChange(report.weekly_report_id, e.target.value)}
                              className="border p-2 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                            >
                              <option value="pending">Set Pending</option>
                              <option value="approved">Set Approved</option>
                              <option value="revise">Set Revise</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    : (filteredMonthlyReports.length > 0 ? filteredMonthlyReports : []).map((report, index) => (
                        <tr 
                          key={report.monthly_report_id} 
                          className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="p-3">{report.submitted_by}</td>
                          <td className="p-3 text-center">{report.month ?? '-'}</td>
                          <td className="p-3 text-center">{report.year ?? '-'}</td>
                          <td className="p-3 text-center">{report.hours_rendered ?? '-'}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <a 
                              href={report.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline flex items-center justify-center gap-1"
                            >
                              <FileText size={14} />
                              {report.file_name.length > 15 ? `${report.file_name.substring(0, 12)}...` : report.file_name}
                            </a>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={report.status}
                              onChange={(e) => handleMonthlyStatusChange(report.monthly_report_id, e.target.value)}
                              className="border p-2 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                            >
                              <option value="pending">Set Pending</option>
                              <option value="approved">Set Approved</option>
                              <option value="revise">Set Revise</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  
                  {((view === 'weekly' && filteredWeeklyReports.length === 0) || 
                    (view === 'monthly' && filteredMonthlyReports.length === 0)) && (
                    <tr>
                      <td colSpan={view === 'weekly' ? 8 : 7} className="p-8 text-center text-gray-500">
                        No reports found matching your filters. Try changing your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
              <div>
                Showing {view === 'weekly' ? filteredWeeklyReports.length : filteredMonthlyReports.length} reports
                {statusFilter !== "all" && ` with status "${statusFilter}"`}
              </div>
              <button 
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                }}
                className="text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;