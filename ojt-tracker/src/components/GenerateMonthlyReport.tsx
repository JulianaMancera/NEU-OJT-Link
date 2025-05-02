import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "../../supabase";
import MonthlyReportPDF from "../services/MonthlyReportPDF";

interface GenMonthlyProps {
  companyName: string;
  job: string;
}

const GenerateMonthlyReport: React.FC<GenMonthlyProps> = ({ companyName, job }) => {
  const [weeklyCount, setWeeklyCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const weeklyLimit = 4;

  // Fetch weekly report count for current user
  useEffect(() => {
    const fetchCount = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setWeeklyCount(0);
        setLoadingCount(false);
        return;
      }
      const { count, error } = await supabase
        .from("weekly_report")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setWeeklyCount(error ? 0 : count || 0);
      setLoadingCount(false);
    };
    fetchCount();
  }, []);

  // Download PDF
  const handleDownload = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;
      const userID = user.id;
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
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

      const reportData = filtered.map((entry) => ({
        week: entry.week_number,
        date: entry.start_date,
        hours: entry.total_hours?.toString() || "0",
      }));
      const totalHours = filtered.reduce(
        (sum, entry) => sum + (entry.total_hours || 0),
        0
      );

      const userInfo = {
        name: user.user_metadata?.full_name || "Unknown User",
        position: job,
        company: companyName,
        date: new Date().toISOString().slice(0, 10),
        reportData,
        totalHours,
      };

      const blob = await pdf(<MonthlyReportPDF {...userInfo} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Monthly_Report_${currentMonth}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  };

  const isEligible = weeklyCount !== null && weeklyCount >= weeklyLimit;
  const remaining = weeklyLimit - (weeklyCount || 0);

  // Click handler: open modal if not eligible, else download
  const onGenerateClick = () => {
    if (loadingCount) return;
    if (!isEligible) {
      setShowModal(true);
    } else {
      handleDownload();
    }
  };

  return (
    <div className="relative">
      {/* Generate Button */}
      <button
        className="text-white mb-3 bg-black px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onGenerateClick}
        disabled={loadingCount || !companyName || !job}
      >
        {loadingCount
          ? "Checking..."
          : isEligible
          ? "Generate Monthly Report"
          : "Generate Monthly Report"}
      </button>

      {/* Modal for eligibility info */}
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
            <p className="mb-2">
              You have submitted <span className="font-bold">{weeklyCount}</span> weekly report{weeklyCount === 1 ? '' : 's'}.
            </p>
            <p className="mb-4">
              You need <span className="font-bold">{remaining}</span> more weekly report{remaining === 1 ? '' : 's'} to generate a monthly report.
            </p>
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
