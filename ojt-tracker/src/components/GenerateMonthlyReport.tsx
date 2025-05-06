import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "../../supabase";
import MonthlyReportPDF from "../services/MonthlyReportPDF";
import { FileText } from "lucide-react";

interface GenMonthlyProps {
  companyName: string;
  job: string;
}

const weeklyLimit = 4;

const GenerateMonthlyReport: React.FC<GenMonthlyProps> = ({ companyName, job }) => {
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const [approvedCount, setApprovedCount]   = useState<number | null>(null);
  const [loadingCount, setLoadingCount]     = useState(true);
  const [showModal, setShowModal]           = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoadingCount(true);

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setSubmittedCount(0);
        setApprovedCount(0);
        setLoadingCount(false);
        return;
      }

      const userID = user.id;
      const today  = new Date();

      // compute first day of this month
      const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      // compute first day of next month
      const firstOfNextMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        1
      );

      const start = firstOfThisMonth.toISOString().slice(0, 10); // "YYYY-MM-01"
      const next  = firstOfNextMonth.toISOString().slice(0, 10); // "YYYY-MM-01" next month

      // total submitted this month
      const { count: total, error: totalError } = await supabase
        .from("weekly_report")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", userID)
        .gte("start_date", start)
        .lt("start_date", next);

      // approved this month
      const { count: approved, error: approvedError } = await supabase
        .from("weekly_report")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", userID)
        .eq("status", "approved")
        .gte("start_date", start)
        .lt("start_date", next);

      setSubmittedCount(totalError ? 0 : total || 0);
      setApprovedCount(approvedError ? 0 : approved || 0);
      setLoadingCount(false);
    };

    fetchCounts();
  }, []);

  const handleDownload = async () => {
    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      const userID = user.id;
      const today  = new Date();
      const year   = today.getFullYear();
      const month  = String(today.getMonth() + 1).padStart(2, "0");
      const currentMonth = `${year}-${month}`;

      const { data: weeklyReports, error } = await supabase
        .from("weekly_report")
        .select("*")
        .eq("user_id", userID);

      if (error || !weeklyReports) return;

      const filtered = weeklyReports.filter((entry) =>
        entry.start_date.startsWith(currentMonth)
      );
      if (filtered.length === 0) return;

      const reportData = filtered.sort((a,b) => a.week_number - b.week_number).map((entry) => ({
        week: entry.week_number,
        date: entry.start_date,
        hours: String(entry.total_hours || 0),
      }));
      const totalHours = filtered.reduce(
        (sum, entry) => sum + (entry.total_hours || 0),
        0
      );

      const userInfo = {
        name: user.user_metadata?.full_name || "Unknown User",
        position: job,
        company: companyName,
        date: today.toISOString().slice(0, 10),
        reportData,
        totalHours,
      };

      const blob = await pdf(<MonthlyReportPDF {...userInfo} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Monthly_Report_${currentMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  };

  const isReadyToGenerate =
    (submittedCount ?? 0) >= weeklyLimit &&
    (approvedCount  ?? 0) >= weeklyLimit;

  const missingSubmissions = weeklyLimit - (submittedCount ?? 0);
  const missingApprovals   = weeklyLimit - (approvedCount ?? 0);

  const onGenerateClick = () => {
    if (loadingCount) return;
    if (!isReadyToGenerate) setShowModal(true);
    else handleDownload();
  };

  return (
    <div className="relative">
      <button
        onClick={onGenerateClick}
        disabled={loadingCount || !companyName || !job}
        className="flex items-center gap-2 text-white mt-4 mb-4 bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="w-5 h-5" />
        {loadingCount ? "Checking..." : "Generate Monthly Report"}
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setShowModal(false)}
          />
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm text-center z-60">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              ❌ Not Eligible Yet
            </h3>

            {submittedCount! < weeklyLimit ? (
              <>
                <p className="mb-2 text-black">
                  You have submitted{" "}
                  <span className="font-bold">{submittedCount}</span> weekly
                  report{submittedCount === 1 ? "" : "s"}.
                </p>
                <p className="mb-4 text-black">
                  You need{" "}
                  <span className="font-bold">{missingSubmissions}</span> more
                  submission{missingSubmissions === 1 ? "" : "s"} to generate
                  a monthly report.
                </p>
              </>
            ) : (
              <>
                <p className="mb-2 text-black">
                  You have{" "}
                  <span className="font-bold">{approvedCount}</span> approved
                  report{approvedCount === 1 ? "" : "s"}.
                </p>
                <p className="mb-4 text-black">
                  Waiting for{" "}
                  <span className="font-bold">{missingApprovals}</span> more
                  approval{missingApprovals === 1 ? "" : "s"} from the admin.
                </p>
              </>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateMonthlyReport;
