import { pdf } from "@react-pdf/renderer";
import { supabase } from "../../supabase";
import MonthlyReportPDF from "../services/MonthlyReportPDF";


interface EndorsmentProps{
    companyName: string;
    job: string;
}
const GenerateMonthlyReport: React.FC<EndorsmentProps> = ({companyName, job}) =>  {
    const handleDownload = async () => {
        if (!companyName || !job) return;
      
        try {
          const user = await supabase.auth.getUser();
          const userID = user?.data?.user?.id;
      
          const today = new Date();
          const year = today.getFullYear();
          const month = (today.getMonth() + 1).toString().padStart(2, '0'); // '04'
          const currentMonth = `${year}-${month}`; // '2025-04'
      
          const { data: weeklyReports, error } = await supabase
            .from('weekly_report')
            .select("*")
            .eq("user_id", userID);
      
          if (error) throw error;
      
          // Filter to current month
          const filtered = weeklyReports.filter(entry =>
            entry.start_date.startsWith(currentMonth)
          );
      
          // Transform into PDF-friendly format
          const reportData = filtered.map(entry => ({
            week : entry.week_number,
            date: entry.start_date,
            hours: entry.total_hours?.toString() || "0"
          }));
      
          // Calculate total hours
          const totalHours = filtered.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
      
          const userInfo = {
            name: user.data.user?.user_metadata?.full_name,
            position: job,
            company: companyName,
            date: new Date().toISOString().slice(0, 10),
            reportData,
            totalHours
          };
      
          const blob = await pdf(<MonthlyReportPDF {...userInfo} />).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "Monthly_Report.pdf";
          link.click();
          URL.revokeObjectURL(url);
      
        } catch (error) {
          console.error("Failed to generate report:", error);
        }
      }; 

    return(
        <div> 
            <button className="text-white mb-3 bg-black"onClick={handleDownload}>Click to Generate Monthly Report</button>
        </div>
    )
}
export default GenerateMonthlyReport;