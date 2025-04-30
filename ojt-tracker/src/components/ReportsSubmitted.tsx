import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { Pencil, Trash2 } from "lucide-react";

interface Report {
  id: number;
  week: number;
  dueDate: string;
  status: "approved" | "pending" | "rejected";
  fileUrl?: string;
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

  useEffect(() => {
    const fetchReports = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("weekly_report")
        .select("weekly_report_id, week_number, uploaded_at, status, file_url")
        .eq("submitted_by", user.user_metadata?.full_name)
        .order("week_number", { ascending: true });

      if (error) {
        console.error("Error fetching reports:", error);
        return;
      }

      const updatedReports = data?.map((r) => ({
        id: r.weekly_report_id,
        week: r.week_number,
        dueDate: calculateDueDate(r.week_number),
        status: r.status as Report["status"],
        fileUrl: r.file_url,
      }));

      setReports(updatedReports || []);
    };

    fetchReports();
  }, []);

  const calculateDueDate = (week: number): string => {
    const baseDate = new Date("2025-03-16");
    const due = new Date(baseDate);
    due.setDate(baseDate.getDate() + (week - 1) * 7);
    return due.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (week: number) => {
    const confirmed = confirm(`Delete Week ${week} report?`);
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("weekly_report")
      .select("file_url")
      .eq("submitted_by", user.user_metadata?.full_name)
      .eq("week_number", week)
      .limit(1)
      .single();

    if (error || !data) {
      alert(`No file found for Week ${week}`);
      return;
    }

    const filePath = data.file_url.split("/weekly_reports/").pop()!;
    const { data: signedUrlData } = await supabase.storage
      .from("weekly_reports")
      .createSignedUrl(filePath, 60);

    if (signedUrlData?.signedUrl) {
      window.open(signedUrlData.signedUrl, "_blank");
    }
  };

  const getStatusTag = (status: Report["status"]) => {
    switch (status) {
      case "approved":
        return <span className="text-green-600 font-semibold">Approved</span>;
      case "rejected":
        return <span className="text-red-600 font-semibold">Rejected</span>;
      default:
        return <span className="text-black-600 font-semibold">Submitted</span>;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-black">
      <h3 className="text-[1.1rem] font-semibold mb-2 text-black text-center bg-[#D0E8FF] p-6 w-full h-2 flex justify-center items-center">Reports Submitted</h3>
      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.week}
            className="flex justify-between items-center p-3 border border-black rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            <div
              className="flex-grow cursor-pointer"
              onClick={() => fetchReport(report.week)}
            >
              <div className="font-semibold text-black">Week {report.week} Report</div>
              <div className="text-sm text-gray-600">Due: {report.dueDate}</div>
            </div>

            <div className="flex items-center gap-3 ml-4 text-black">
              {getStatusTag(report.status)}

              {report.status !== "approved" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(report.week);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(report.week);
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