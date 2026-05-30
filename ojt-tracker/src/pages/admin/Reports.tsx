import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../supabase";
import AdminLayout from "./AdminLayout";
import { Filter, FileText, Calendar, Search } from "lucide-react";
import type { WeeklyReportRow } from "../../types/WeeklyReportRow";
import type { MonthlyReportRow } from "../../types/MonthlyReportRow";
import type { WeeklyJournalRow } from "../../types/WeeklyJournalRow";

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
  const [view, setView] = useState<"weekly" | "monthly" | "journal">("weekly");
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [weeklyJournals, setWeeklyJournals] = useState<WeeklyJournal[]>([]);
  const [filteredWeeklyReports, setFilteredWeeklyReports] = useState<WeeklyReport[]>([]);
  const [filteredMonthlyReports, setFilteredMonthlyReports] = useState<MonthlyReport[]>([]);
  const [filteredWeeklyJournals, setFilteredWeeklyJournals] = useState<WeeklyJournal[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (view === "weekly") fetchWeeklyReports();
    else if (view === "monthly") fetchMonthlyReports();
    else fetchWeeklyJournals();
  }, [view]);

  const applyFilters = useCallback(() => {
    const matchesStatus = (s: string) => statusFilter === "all" || s === statusFilter;
    const matchesSearch = (name: string, extra?: string) =>
      !searchTerm ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (extra ?? "").includes(searchTerm);

    setFilteredWeeklyReports(
      weeklyReports.filter(
        (r) => matchesStatus(r.status) && matchesSearch(r.submitted_by, r.week_number.toString())
      )
    );
    setFilteredMonthlyReports(
      monthlyReports.filter(
        (r) =>
          matchesStatus(r.status) &&
          matchesSearch(
            r.submitted_by,
            `${r.month ?? ""} ${r.year ?? ""}`
          )
      )
    );
    setFilteredWeeklyJournals(
      weeklyJournals.filter(
        (j) => matchesStatus(j.status) && matchesSearch(j.submitted_by, j.start_date)
      )
    );
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
      console.error("Error fetching weekly reports:", error.message);
    } else if (data) {
      const enriched: WeeklyReport[] = data.map((r) => ({
        weekly_report_id: r.weekly_report_id,
        userName: r.user.name,
        submitted_by: r.user.name,
        start_date: r.start_date,
        end_date: r.end_date,
        week_number: r.week_number,
        status: r.status,
        file_name: r.file_name,
        file_url: r.file_url,
        total_hours: r.total_hours,
      }));
      setWeeklyReports(enriched);
      setFilteredWeeklyReports(enriched);
    }
    setLoading(false);
  };

  const fetchMonthlyReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from<"monthly_report", MonthlyReportRow>("monthly_report")
      .select("*, user: user_id ( name )");
    if (data) {
      const enriched = data.map((r) => ({
        monthly_report_id: r.monthly_report_id,
        userName: r.user.name,
        submitted_by: r.user.name,
        month: r.month,
        year: r.year,
        status: r.status,
        hours_rendered: r.hours_rendered,
        file_name: r.file_name,
        file_url: r.file_url,
      }));
      setMonthlyReports(enriched);
      setFilteredMonthlyReports(enriched);
    }
    setLoading(false);
  };

  const fetchWeeklyJournals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from<"weekly_journal", WeeklyJournalRow>("weekly_journal")
      .select("*, user: user_id ( name )");
    if (data) {
      const enriched = data.map((r) => ({
        weekly_journal_id: r.weekly_journal_id,
        userName: r.user.name,
        submitted_by: r.user.name,
        start_date: r.start_date,
        uploaded_at: r.uploaded_at,
        status: r.status,
        file_name: r.file_name,
        file_url: r.file_url,
      }));
      setWeeklyJournals(enriched);
      setFilteredWeeklyJournals(enriched);
    }
    setLoading(false);
  };

  const handleWeeklyStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("weekly_report")
      .update({ status: newStatus })
      .eq("weekly_report_id", id);
    if (!error)
      setWeeklyReports((prev) => prev.map((r) => (r.weekly_report_id === id ? { ...r, status: newStatus } : r)));
    setLoading(false);
  };

  const handleMonthlyStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("monthly_report")
      .update({ status: newStatus })
      .eq("monthly_report_id", id);
    if (!error)
      setMonthlyReports((prev) => prev.map((r) => (r.monthly_report_id === id ? { ...r, status: newStatus } : r)));
    setLoading(false);
  };

  const handleJournalStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("weekly_journal")
      .update({ status: newStatus })
      .eq("weekly_journal_id", id);
    if (!error)
      setWeeklyJournals((prev) => prev.map((j) => (j.weekly_journal_id === id ? { ...j, status: newStatus } : j)));
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-300";
      case "pending":  return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "revise":   return "bg-red-100 text-red-800 border-red-300";
      default:         return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const shortFileName = (name: string) =>
    name.length > 15 ? `${name.substring(0, 12)}…` : name;

  const currentCount =
    view === "weekly"
      ? filteredWeeklyReports.length
      : view === "monthly"
      ? filteredMonthlyReports.length
      : filteredWeeklyJournals.length;

  return (
    <AdminLayout>
      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black shadow-lg">
        <h2 className="text-center py-4 font-bold text-5xl mb-6">Reports Management</h2>

        <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
          <button
            onClick={() => setView("weekly")}
            className={`px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm ${
              view === "weekly" ? "bg-blue-600 text-white font-medium" : "bg-white hover:bg-gray-100"
            }`}
          >
            <Calendar size={18} /> Weekly Reports
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm ${
              view === "monthly" ? "bg-blue-600 text-white font-medium" : "bg-white hover:bg-gray-100"
            }`}
          >
            <Calendar size={18} /> Monthly Reports
          </button>
          <button
            onClick={() => setView("journal")}
            className={`px-6 py-3 rounded-md flex items-center gap-2 transition-all shadow-sm ${
              view === "journal" ? "bg-green-600 text-white font-medium" : "bg-white hover:bg-gray-100"
            }`}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-gray-500" />
            <label htmlFor="status-filter" className="font-medium">Filter by Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
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
                    {view === "weekly" && (
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
                    {view === "monthly" && (
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
                    {view === "journal" && (
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
                  {view === "weekly" &&
                    filteredWeeklyReports.map((r, idx) => (
                      <tr key={r.weekly_report_id} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="p-3">{r.submitted_by}</td>
                        <td className="p-3">{new Date(r.start_date).toLocaleDateString()}</td>
                        <td className="p-3">{r.end_date ? new Date(r.end_date).toLocaleDateString() : "-"}</td>
                        <td className="p-3 text-center">{r.week_number}</td>
                        <td className="p-3 text-center">{r.total_hours}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                        </td>
                        <td className="p-3 text-center">
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                            <FileText size={14} /> {shortFileName(r.file_name)}
                          </a>
                        </td>
                        <td className="p-3 text-center">
                          <select value={r.status} onChange={(e) => handleWeeklyStatusChange(r.weekly_report_id, e.target.value)} className="border p-2 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 w-full">
                            <option value="pending">Set Pending</option>
                            <option value="approved">Set Approved</option>
                            <option value="revise">Set Revise</option>
                          </select>
                        </td>
                      </tr>
                    ))}

                  {view === "monthly" &&
                    filteredMonthlyReports.map((r, idx) => (
                      <tr key={r.monthly_report_id} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="p-3">{r.submitted_by}</td>
                        <td className="p-3 text-center">{r.month ?? "-"}</td>
                        <td className="p-3 text-center">{r.year ?? "-"}</td>
                        <td className="p-3 text-center">{r.hours_rendered ?? "-"}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                        </td>
                        <td className="p-3 text-center">
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                            <FileText size={14} /> {shortFileName(r.file_name)}
                          </a>
                        </td>
                        <td className="p-3 text-center">
                          <select value={r.status} onChange={(e) => handleMonthlyStatusChange(r.monthly_report_id, e.target.value)} className="border p-2 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500 w-full">
                            <option value="pending">Set Pending</option>
                            <option value="approved">Set Approved</option>
                            <option value="revise">Set Revise</option>
                          </select>
                        </td>
                      </tr>
                    ))}

                  {view === "journal" &&
                    filteredWeeklyJournals.map((j, idx) => (
                      <tr key={j.weekly_journal_id} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="p-3">{j.submitted_by}</td>
                        <td className="p-3 text-center">{new Date(j.start_date).toLocaleDateString()}</td>
                        <td className="p-3 text-center">{new Date(j.uploaded_at).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(j.status)}`}>{j.status}</span>
                        </td>
                        <td className="p-3 text-center">
                          <a href={j.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {shortFileName(j.file_name)}
                          </a>
                        </td>
                        <td className="p-3 text-center">
                          <select value={j.status} onChange={(e) => handleJournalStatusChange(j.weekly_journal_id, e.target.value)} className="border p-2 rounded-md w-full">
                            <option value="pending">Set Pending</option>
                            <option value="approved">Set Approved</option>
                            <option value="revise">Set Revise</option>
                          </select>
                        </td>
                      </tr>
                    ))}

                  {currentCount === 0 && (
                    <tr>
                      <td colSpan={view === "journal" ? 6 : view === "weekly" ? 8 : 7} className="p-8 text-center text-gray-500">
                        No {view === "journal" ? "journals" : "reports"} found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
              <div>
                Showing {currentCount} {view === "journal" ? "journals" : "reports"}
                {statusFilter !== "all" && ` with status "${statusFilter}"`}
              </div>
              <button
                onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}
                className="text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
