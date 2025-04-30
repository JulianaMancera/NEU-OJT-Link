import { pdf } from "@react-pdf/renderer";
import { supabase } from "../../supabase";
import MonthlyReportPDF from "../services/MonthlyReportPDF";

interface EndorsmentProps {
  companyName: string;
  job: string;
}

const GenerateMonthlyReport: React.FC<EndorsmentProps> = ({ companyName, job }) => {
  const handleDownload = async () => {
    if (!companyName || !job) {
      console.error("Missing companyName or job");
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("User fetch error:", userError?.message);
        return;
      }

      const userID = user.id;

      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, "0"); // e.g., '04'
      const currentMonth = `${year}-${month}`; // e.g., '2025-04'

      const { data: weeklyReports, error } = await supabase
        .from("weekly_report")
        .select("*")
        .eq("user_id", userID);

      if (error) {
        console.error("Error fetching weekly reports:", error.message);
        throw error;
      }

      if (!weeklyReports || weeklyReports.length === 0) {
        console.error("No weekly reports found for user:", userID);
        return;
      }

      // Filter to current month
      const filtered = weeklyReports.filter((entry) =>
        entry.start_date.startsWith(currentMonth)
      );

      if (filtered.length === 0) {
        console.error("No reports found for the current month:", currentMonth);
        return;
      }

      // Transform into PDF-friendly format
      const reportData = filtered.map((entry) => ({
        week: entry.week_number,
        date: entry.start_date,
        hours: entry.total_hours?.toString() || "0",
      }));

      // Calculate total hours
      const totalHours = filtered.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);

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

  return (
    <div>
      <button
        className="text-white mb-3 bg-black px-4 py-2 rounded"
        onClick={handleDownload}
        disabled={!companyName || !job}
      >
        Generate Monthly Report
      </button>
    </div>
  );
};

export default GenerateMonthlyReport;