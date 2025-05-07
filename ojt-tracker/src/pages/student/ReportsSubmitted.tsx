import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { Pencil, Trash2 } from "lucide-react";

interface Report {
  id: string;
  week?: number;
  month?: number;
  monthName?: string;
  submittedDate: string;
  dueDate?: string;
  status: "approved" | "pending" | "revise";
  fileUrl?: string;
  type: "weekly" | "monthly" | "journal";
}

interface ReportsSubmittedProps {
  onEdit?: (week: number) => void;
  onRemove?: (week: number) => void;
}

const ReportsSubmitted: React.FC<ReportsSubmittedProps> = ({
  onEdit,
  onRemove,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedType, setSelectedType] = useState<"weekly" | "monthly" | "journal">("weekly");

  useEffect(() => {
    async function fetchReports() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const fullName = user.user_metadata?.full_name;

      // Weekly Reports
      const { data: weeklyData, error: weeklyError } = await supabase
        .from("weekly_report")
        .select("weekly_report_id, week_number, start_date, status, file_url")
        .eq("submitted_by", fullName);

      // Monthly Reports
      const { data: monthlyData, error: monthlyError } = await supabase
        .from("monthly_report")
        .select("monthly_report_id, month, uploaded_at, status, file_url")
        .eq("submitted_by", fullName);

      // Weekly Journals
      const { data: journalData, error: journalError } = await supabase
        .from("weekly_journal")
        .select("weekly_journal_id, start_date, status, file_url")
        .eq("submitted_by", fullName);

      if (weeklyError || monthlyError || journalError) {
        console.error("Error fetching reports:", { weeklyError, monthlyError, journalError });
        return;
      }

      const fmt = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      function calculateDueDate(start: Date): string {
        const day = start.getDay();
        const daysToSat = (6 - day + 7) % 7;
        const due = new Date(start);
        due.setDate(start.getDate() + daysToSat);
        due.setHours(23, 59, 59, 999);
        return `${fmt(due)} (Saturday 11:59 PM)`;
      }

      const weekly = (weeklyData ?? []).map((r) => ({
        id:            r.weekly_report_id,
        week:          r.week_number,
        submittedDate: fmt(new Date(r.start_date)),
        dueDate:       calculateDueDate(new Date(r.start_date)),
        status:        r.status as Report["status"],
        fileUrl:       r.file_url,
        type:          "weekly" as const,
      }));

      const monthly = (monthlyData ?? []).map((r) => {
        const submitted = new Date(r.uploaded_at);
        const monthNum = r.month;
      
        const monthName =
          typeof monthNum === "number"
            ? new Date(submitted.getFullYear(), monthNum - 1, 1).toLocaleString("en-US", { month: "long" })
            : "Unknown";
        const endOfMonth = new Date(submitted.getFullYear(), submitted.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          id:            r.monthly_report_id,
          submittedDate: fmt(submitted),
          dueDate:       `${fmt(endOfMonth)} (End of month)`,
          status:        r.status as Report["status"],
          fileUrl:       r.file_url,
          type:          "monthly" as const,
          month:         monthNum ?? 0, // fallback to 0 if null
          monthName,
        };
      });
      

      const journals = (journalData ?? []).map((r) => ({
        id:            r.weekly_journal_id, 
        submittedDate: fmt(new Date(r.start_date)),
        dueDate:       calculateDueDate(new Date(r.start_date)),
        status:        r.status as Report["status"],
        fileUrl:       r.file_url,
        type:          "journal" as const,
      }));

      setReports([...weekly, ...monthly, ...journals]);
    }

    fetchReports();
  }, []);

  const handleDelete = async (week: number) => {
    if (!confirm(`Delete Week ${week} report?`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("weekly_report")
      .delete()
      .eq("submitted_by", user.user_metadata?.full_name)
      .eq("week_number", week);
    if (error) {
      alert("Failed to delete report.");
      return;
    }
    setReports(reports.filter((r) => r.week !== week));
    onRemove?.(week);
  };

  const fetchReport = async (week: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("weekly_report")
      .select("file_url")
      .eq("submitted_by", user.user_metadata?.full_name)
      .eq("week_number", week)
      .single();
    if (error || !data) {
      alert(`No file found for Week ${week}`);
      return;
    }
    const filePath = data.file_url.split("/weekly_reports/").pop()!;
    const { data: signedUrlData } = await supabase.storage
      .from("weekly_reports")
      .createSignedUrl(filePath, 60);
    if (signedUrlData?.signedUrl) window.open(signedUrlData.signedUrl, "_blank");
  };

  const getStatusTag = (status: Report["status"]) => {
    switch (status) {
      case "approved":
        return <span className="text-green-600 font-semibold">Approved</span>;
      case "revise":
        return <span className="text-red-600 font-semibold">Revise</span>;
      default:
        return <span className="text-black-600 font-semibold">Submitted</span>;
    }
  };

  // only show reports of the chosen type
  const filtered = reports
    .filter(r => r.type === selectedType)
    .sort((a, b) => {
      // if both have a week number, sort numerically
     if (typeof a.week === "number" && typeof b.week === "number") {
        return a.week - b.week;
      }
      // otherwise leave in original insertion order
      return 0;
    });

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-black">
      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setSelectedType("weekly")}
          className={`px-4 py-2 rounded ${selectedType === "weekly" 
            ? "bg-blue-600 text-white" 
            : "bg-black hover:bg-blue-600 text-white"}`}
        >
          Weekly Reports
        </button>
        <button
          onClick={() => setSelectedType("journal")}
          className={`px-4 py-2 rounded ${selectedType === "journal" 
            ? "bg-blue-600 text-white" 
            : "bg-black hover:bg-blue-600 text-white"}`}
        >
          Weekly Journals
        </button>
        <button
          onClick={() => setSelectedType("monthly")}
          className={`px-4 py-2 rounded ${selectedType === "monthly" 
            ? "bg-blue-600 text-white" 
            : "bg-black hover:bg-blue-600 text-white"}`}
        >
          Monthly Reports
        </button>
      </div>

      <h3 className="text-[1.1rem] font-semibold mb-2 text-black text-center bg-[#D0E8FF] p-6 border-b border-black">
        {selectedType === "weekly" ? "Your Weekly Reports"
         : selectedType === "journal" ? "Your Weekly Journals"
         : "Your Monthly Reports"}
      </h3>

      <div className="space-y-3 mt-4">
        {filtered.map((report) => (
          <div
            key={report.id}
            className="flex justify-between items-center p-3 border border-black rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            <div
              className="flex-grow cursor-pointer"
              onClick={() => report.week != null && fetchReport(report.week)}
            >
              <div className="font-semibold text-black">
                {report.type === "weekly"  && `Week ${report.week} Report`}
                {report.type === "journal" && `Journal – Week ${report.week}`}
                {report.type === "monthly" &&
                  `Monthly Report – ${report.monthName} (${report.month
                          ?.toString()
                          .padStart(2, "0")})`
                }
              </div>
              <div className="text-sm text-gray-600">
                Date Submitted: {report.submittedDate}
              </div>
              <div className="text-sm text-gray-600">
                Due: {report.dueDate}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4 text-black">
              {getStatusTag(report.status)}

              {report.status !== "approved" && report.week != null && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(report.week!);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(report.week!);
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsSubmitted;
