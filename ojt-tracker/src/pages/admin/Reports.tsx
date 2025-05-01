import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "../../components/SideBar";
import OJTLogo from "/src/assets/ojt-white.png";

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
