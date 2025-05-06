import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { User, Settings, CircleHelp, LogOut, UserCog, Filter, FileText, Calendar, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { WeeklyReportRow } from "../../types/WeeklyReportRow";
import type { MonthlyReportRow }  from "../../types/MonthlyReportRow";
import type { WeeklyJournalRow }  from "../../types/WeeklyJournalRow";


interface WeeklyReport {
  weekly_report_id: string;
  userName: string;
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
  userName: string;
  month: number | null;
  year: number | null;
  status: string;
  hours_rendered: number | null;
  submitted_by: string;
  file_name: string;
  file_url: string;
}

interface WeeklyJournal {
  weekly_journal_id: string;
  userName: string;
  submitted_by: string;
  start_date: string;
  uploaded_at: string;
  status: string;
  file_name: string;
  file_url: string;
}

const Reports = () => {
  const [view, setView] = useState<'weekly' | 'monthly' | 'journal'>('weekly');
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [weeklyJournals, setWeeklyJournals] = useState<WeeklyJournal[]>([]);
  const [filteredWeeklyReports, setFilteredWeeklyReports] = useState<WeeklyReport[]>([]);
  const [filteredMonthlyReports, setFilteredMonthlyReports] = useState<MonthlyReport[]>([]);
  const [filteredWeeklyJournals, setFilteredWeeklyJournals] = useState<WeeklyJournal[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    if (view === 'weekly') fetchWeeklyReports();
    else if (view === 'monthly') fetchMonthlyReports();
    else if (view === 'journal') fetchWeeklyJournals();
  }, [view]);

  const applyFilters = useCallback(() => {
    let filteredWeekly = [...weeklyReports];
    
    if (statusFilter !== "all") {
      filteredWeekly = filteredWeekly.filter(report => report.status === statusFilter);
    }
    
    if (searchTerm) {
      filteredWeekly = filteredWeekly.filter(report => 
        report.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.week_number.toString().includes(searchTerm)
      );
    }
    
    setFilteredWeeklyReports(filteredWeekly);

    let filteredMonthly = [...monthlyReports];
    
    if (statusFilter !== "all") {
      filteredMonthly = filteredMonthly.filter(report => report.status === statusFilter);
    }
    
    if (searchTerm) {
      filteredMonthly = filteredMonthly.filter(report => 
        report.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.month && report.month.toString().includes(searchTerm)) ||
        (report.year && report.year.toString().includes(searchTerm))
      );
    }
    
    setFilteredMonthlyReports(filteredMonthly);

    let filteredJournal = [...weeklyJournals];
    if (statusFilter !== 'all') {
      filteredJournal = filteredJournal.filter(j => j.status === statusFilter);
    }
    if (searchTerm) {
      filteredJournal = filteredJournal.filter(j =>
        j.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.start_date.includes(searchTerm)
      );
    }
    setFilteredWeeklyJournals(filteredJournal);
  }, [statusFilter, weeklyReports, monthlyReports, weeklyJournals, searchTerm]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchWeeklyReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
    .from<"weekly_report", WeeklyReportRow>("weekly_report")
    .select("*, user: user_id ( name )");
  
    if (error) {
      console.error('Error fetching weekly reports:', error.message);
    } else if (data) {
      const enriched: WeeklyReport[] = data.map(r => ({
        weekly_report_id: r.weekly_report_id,
        userName:         r.user.name,
        submitted_by:     r.user.name,
        start_date:       r.start_date,
        end_date:         r.end_date,
        week_number:      r.week_number,
        status:           r.status,
        file_name:        r.file_name,
        file_url:         r.file_url,
        total_hours:      r.total_hours,
      }));
  
      setWeeklyReports(enriched);
      setFilteredWeeklyReports(enriched);
    }
  
    setLoading(false);
  };
  

  const fetchMonthlyReports = async () => {
    setLoading(true);
    const { data: monthlyData } = await supabase
    .from<"monthly_report", MonthlyReportRow>("monthly_report")
    .select("*, user: user_id ( name )");

    if (monthlyData) {
      const enriched = monthlyData.map((r) => ({
        monthly_report_id: r.monthly_report_id,
        userName:          r.user.name,
        submitted_by:      r.user.name,
        month:             r.month,
        year:              r.year,
        status:            r.status,
        hours_rendered:    r.hours_rendered,
        file_name:         r.file_name,
        file_url:          r.file_url,
      }));
      setMonthlyReports(enriched);
      setFilteredMonthlyReports(enriched);
    }
    setLoading(false);
  };

  const fetchWeeklyJournals = async () => {
    setLoading(true);
    const { data: journalData } = await supabase
    .from<"weekly_journal", WeeklyJournalRow>("weekly_journal")
    .select("*, user: user_id ( name )");

    if (journalData) {
      const enriched = journalData.map((r) => ({
        weekly_journal_id: r.weekly_journal_id,
        userName:          r.user.name,
        submitted_by:      r.user.name,
        start_date:        r.start_date,
        uploaded_at:       r.uploaded_at,
        status:            r.status,
        file_name:         r.file_name,
        file_url:          r.file_url,
      }));
      setWeeklyJournals(enriched);
      setFilteredWeeklyJournals(enriched);
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

  const handleJournalStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('weekly_journal')
      .update({ status: newStatus })
      .eq('weekly_journal_id', id);
    if (error) console.error('Error updating journal status:', error.message);
    else {
      setWeeklyJournals(prev =>
        prev.map(j => j.weekly_journal_id === id ? { ...j, status: newStatus } : j)
      );
    }
    setLoading(false);
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

      <div className="w-full h-[80px] fixed absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-black flex items-center justify-between px-6 z-10">

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
        <h2 className="text-center justify-center py-4 font-bold text-5xl mb-6">
          Reports Management
        </h2>

        <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
          <button
            onClick={() => setView('weekly')}
            className={`px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm ${
              view === 'weekly' ? 'bg-blue-600 text-white font-medium' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Calendar size={18} /> Weekly Reports
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm ${
              view === 'monthly' ? 'bg-blue-600 text-white font-medium' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Calendar size={18} /> Monthly Reports
          </button>
          <button
            onClick={() => setView('journal')}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all flex items-center gap-2 shadow-md"
          >
            <FileText size={18} /> Weekly Journals
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6 shadow-sm border flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or number..."
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
              <option value="revise">Revise</option>
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
                    {view === 'weekly' && (
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
                    )}
                    {view === 'monthly' && (
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
                    {view === 'journal' && (
                      <>
                        <th className="p-3 text-left">Submitted By</th>
                        <th className="p-3 text-center">Start Date</th>
                        <th className="p-3 text-center">Uploaded At</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">File</th>
                        <th className="p-3 text-center">Action</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {view === 'weekly' && filteredWeeklyReports.map((weeklyReport, idx) => (
                    <tr
                      key={weeklyReport.weekly_report_id}
                      className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="p-3">{weeklyReport.submitted_by}</td>
                      <td className="p-3">{new Date(weeklyReport.start_date).toLocaleDateString()}</td>
                      <td className="p-3">
                        {weeklyReport.end_date
                          ? new Date(weeklyReport.end_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="p-3 text-center">{weeklyReport.week_number}</td>
                      <td className="p-3 text-center">{weeklyReport.total_hours}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            weeklyReport.status
                          )}`}
                        >
                          {weeklyReport.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href={weeklyReport.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center justify-center gap-1"
                        >
                          <FileText size={14} />
                          {weeklyReport.file_name.length > 15
                            ? `${weeklyReport.file_name.substring(0, 12)}…`
                            : weeklyReport.file_name}
                        </a>
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={weeklyReport.status}
                          onChange={e =>
                            handleWeeklyStatusChange(weeklyReport.weekly_report_id, e.target.value)
                          }
                          className="border p-2 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        >
                          <option value="pending">Set Pending</option>
                          <option value="approved">Set Approved</option>
                          <option value="revise">Set Revise</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {view === 'monthly' && filteredMonthlyReports.map((monthlyReport, idxMon) => (
                    <tr
                      key={monthlyReport.monthly_report_id}
                      className={`border-b hover:bg-gray-50 ${idxMon % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="p-3">{monthlyReport.submitted_by}</td>
                      <td className="p-3 text-center">{monthlyReport.month ?? '-'}</td>
                      <td className="p-3 text-center">{monthlyReport.year ?? '-'}</td>
                      <td className="p-3 text-center">{monthlyReport.hours_rendered ?? '-'}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            monthlyReport.status
                          )}`}
                        >
                          {monthlyReport.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href={monthlyReport.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center justify-center gap-1"
                        >
                          <FileText size={14} />
                          {monthlyReport.file_name.length > 15
                            ? `${monthlyReport.file_name.substring(0, 12)}…`
                            : monthlyReport.file_name}
                        </a>
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={monthlyReport.status}
                          onChange={e =>
                            handleMonthlyStatusChange(monthlyReport.monthly_report_id, e.target.value)
                          }
                          className="border p-2 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        >
                          <option value="pending">Set Pending</option>
                          <option value="approved">Set Approved</option>
                          <option value="revise">Set Revise</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {view === 'journal' && filteredWeeklyJournals.map((journalEntry, idxJour) => (
                    <tr
                      key={journalEntry.weekly_journal_id}
                      className={`border-b hover:bg-gray-50 ${idxJour % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="p-3">{journalEntry.submitted_by}</td>
                      <td className="p-3 text-center">
                        {new Date(journalEntry.start_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">
                        {new Date(journalEntry.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            journalEntry.status
                          )}`}
                        >
                          {journalEntry.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href={journalEntry.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {journalEntry.file_name.length > 15
                            ? `${journalEntry.file_name.substring(0, 12)}…`
                            : journalEntry.file_name}
                        </a>
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={journalEntry.status}
                          onChange={e =>
                            handleJournalStatusChange(
                              journalEntry.weekly_journal_id,
                              e.target.value
                            )
                          }
                          className="border p-2 rounded-md w-full"
                        >
                          <option value="pending">Set Pending</option>
                          <option value="approved">Set Approved</option>
                          <option value="revise">Set Revise</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {(
                    (view === 'weekly' && filteredWeeklyReports.length === 0) ||
                    (view === 'monthly' && filteredMonthlyReports.length === 0) ||
                    (view === 'journal' && filteredWeeklyJournals.length === 0)
                  ) && (
                    <tr>
                      <td
                        colSpan={
                          view === 'journal' ? 6 : view === 'weekly' ? 8 : 7
                        }
                        className="p-8 text-center text-gray-500"
                      >
                        No {view === 'journal' ? 'journals' : 'reports'} found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
              <div>
                Showing{' '}
                {view === 'weekly'
                  ? filteredWeeklyReports.length
                  : view === 'monthly'
                  ? filteredMonthlyReports.length
                  : filteredWeeklyJournals.length}{' '}
                {view === 'journal' ? 'journals' : 'reports'}
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
    </div>
  );
};

export default Reports;