import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { User, Settings, CircleHelp, LogOut, UserCog } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
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
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    if (view === 'weekly') fetchWeeklyReports();
    else fetchMonthlyReports();
  }, [view]);

  const fetchWeeklyReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('weekly_report')
      .select('*');
    if (error) console.error('Error fetching weekly reports:', error.message);
    else setWeeklyReports(data || []);
    setLoading(false);
  };

  const fetchMonthlyReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('monthly_report')
      .select('*');
    if (error) console.error('Error fetching monthly reports:', error.message);
    else setMonthlyReports(data || []);
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

      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black">
        <h2 className="text-center justify-center py-4 font-bold text-5xl mb-6">Reports Management</h2>

        {/* View Toggle Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded ${view === 'weekly' ? 'bg-[#90D5FF]' : 'bg-gray-200'}`}
          >
            Weekly Reports
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded ${view === 'monthly' ? 'bg-[#90D5FF]' : 'bg-gray-200'}`}
          >
            Monthly Reports
          </button>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-950 text-white">
              <tr>
                {view === 'weekly' ? (
                  <>
                    <th className="p-2 border">Submitted By</th>
                    <th className="p-2 border">Start Date</th>
                    <th className="p-2 border">End Date</th>
                    <th className="p-2 border">Week #</th>
                    <th className="p-2 border">Total Hours</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">File</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border">Submitted By</th>
                    <th className="p-2 border">Month</th>
                    <th className="p-2 border">Year</th>
                    <th className="p-2 border">Hours Rendered</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">File</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {view === 'weekly'
                ? weeklyReports.map(report => (
                    <tr key={report.weekly_report_id} className="text-center bg-gray-100">
                      <td className="p-2 border">{report.submitted_by}</td>
                      <td className="p-2 border">{report.start_date}</td>
                      <td className="p-2 border">{report.end_date || '-'}</td>
                      <td className="p-2 border">{report.week_number}</td>
                      <td className="p-2 border">{report.total_hours}</td>
                      <td className="p-2 border">
                        <select
                          value={report.status}
                          onChange={e => handleWeeklyStatusChange(report.weekly_report_id, e.target.value)}
                          className="border p-1 rounded"
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="revise">revise</option>
                        </select>
                      </td>
                      <td className="p-2 border">
                        <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                          {report.file_name}
                        </a>
                      </td>
                    </tr>
                  ))
                : monthlyReports.map(report => (
                    <tr key={report.monthly_report_id} className="text-center bg-gray-200">
                      <td className="p-2 border">{report.submitted_by}</td>
                      <td className="p-2 border">{report.month ?? '-'}</td>
                      <td className="p-2 border">{report.year ?? '-'}</td>
                      <td className="p-2 border">{report.hours_rendered ?? '-'}</td>
                      <td className="p-2 border">
                        <select
                          value={report.status}
                          onChange={e => handleMonthlyStatusChange(report.monthly_report_id, e.target.value)}
                          className="border p-1 rounded"
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="revise">revise</option>
                        </select>
                      </td>
                      <td className="p-2 border">
                        <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                          {report.file_name}
                        </a>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;