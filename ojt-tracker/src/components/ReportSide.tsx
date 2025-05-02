import React, { useState, useEffect } from "react";
import { File } from "lucide-react";
import { supabase } from "../../supabase";
import WeeklyReport from "../components/WeeklyReport";
import WeeklyJournal from "../components/WeeklyJournal";
import MonthlyReport from "../components/MonthlyReport";
import ReportsSubmitted from "../components/ReportsSubmitted";
import GenerateMonthlyReport from "./GenerateMonthlyReport";
import GenerateCertButton from "./GenerateCertButton";

interface Report {
  weekly_report_id: number;
  week_number: number;
}

const ReportSide: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWeeklyReportModalOpen, setIsWeeklyReportModalOpen] = useState(false);
  const [isWeeklyJournalModalOpen, setIsWeeklyJournalModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [jobPosition, setJobPosition] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const templates = [
    { name: "Weekly Report", file: "WeeklyReport_Surname.pdf" },
    { name: "Weekly Journal", file: "WeeklyJournal_Surname.pdf" },
    { name: "Monthly Report", file: "MonthlyReport_Surname.pdf" },
  ];

  // Fetch company and job details
  useEffect(() => {
    const fetchCompanyAndJob = async () => {
      try {
        setError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("User fetch error:", userError?.message);
          setError("User not authenticated.");
          return;
        }

        setUserId(user.id);

        const { data: application, error: applicationError } = await supabase
          .from("application")
          .select("company_id, job_id")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .single();

        if (applicationError || !application) {
          console.error("No approved application found:", applicationError?.message);
          setError("No approved application found.");
          return;
        }

        const { company_id, job_id } = application;

        const { data: company, error: companyError } = await supabase
          .from("company")
          .select("name")
          .eq("company_id", company_id)
          .single();

        if (companyError || !company) {
          console.error("Company not found:", companyError?.message);
          setError("Company not found.");
          return;
        }

        const { data: job, error: jobError } = await supabase
          .from("job")
          .select("position")
          .eq("job_id", job_id)
          .single();

        if (jobError || !job) {
          console.error("Job position not found:", jobError?.message);
          setError("Job position not found.");
          return;
        }

        setCompanyName(company.name);
        setJobPosition(job.position);
      } catch (err) {
        console.error("Unexpected error in fetchCompanyAndJob:", err);
        setError("An unexpected error occurred while loading company data.");
      }
    };

    fetchCompanyAndJob();
  }, [userId]);

  const handleDownload = async (fileName: string) => {
    setLoading(fileName);
    setError(null);

    const { data, error } = await supabase.storage.from("templates").download(fileName);

    if (error) {
      console.error("Download error:", error);
      setError(`Failed to download ${fileName}: ${error.message}`);
    } else {
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setLoading(null);
  };

  const handleOpenSubmissionModal = (reportType: string) => {
    setEditingReport(null);
    switch (reportType) {
      case "Weekly Report":
        setIsWeeklyReportModalOpen(true);
        break;
      case "Weekly Journal":
        setIsWeeklyJournalModalOpen(true);
        break;
      case "Monthly Report":
        setIsMonthlyReportModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleEditReport = async (week: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("weekly_report")
      .select("weekly_report_id, week_number")
      .eq("submitted_by", user.user_metadata?.full_name)
      .eq("week_number", week)
      .single();

    if (error || !data) {
      console.error("Error fetching report for editing:", error);
      return;
    }

    setEditingReport({ weekly_report_id: data.weekly_report_id, week_number: data.week_number });
    setIsWeeklyReportModalOpen(true);
  };

  const handleRemoveReport = (week: number) => {
    console.log(`Report for week ${week} has been removed`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Templates and Submissions */}
      <div className="col-span-1 space-y-8">
        {/* Templates */}
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100 transform hover:scale-101 transition-all duration-300">
          <h3 className="text-xl font-bold mb-6 text-gray-900 text-center bg-blue-50 p-4 rounded-xl">Templates</h3>
          <div className="space-y-5">
            {templates.map((template) => (
              <div
                key={template.file}
                className={`flex items-center bg-blue-50 py-4 px-6 rounded-xl hover:bg-blue-100 transition-all duration-200 cursor-pointer font-semibold ${
                  loading === template.file ? "text-gray-400" : "text-blue-700 hover:text-blue-900"
                }`}
                onClick={() => handleDownload(template.file)}
              >
                <File className="text-blue-700 mr-3" />
                <span>{loading === template.file ? "Downloading..." : template.name}</span>
              </div>
            ))}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        </div>

        {/* Submissions */}
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100 transform hover:scale-101 transition-all duration-300">
          <h3 className="text-xl font-bold mb-6 text-gray-900 text-center bg-blue-50 p-4 rounded-xl">Submissions</h3>
          <div className="space-y-5">
            {templates.map((template) => (
              <button
                key={template.file}
                onClick={() => handleOpenSubmissionModal(template.name)}
                className="w-full bg-blue-50 text-blue-700 p-4 rounded-xl hover:bg-blue-100 flex items-center justify-start transition-all duration-200 font-semibold"
              >
                <File className="mr-3" />
                {template.name}
              </button>
            ))}
          </div>
          {companyName && jobPosition ? (
            <GenerateMonthlyReport companyName={companyName} job={jobPosition} />
          ) : (
            <p className="text-gray-500 text-sm text-center mt-4">
              Company or job details not available
            </p>
          )}
          {companyName && jobPosition ? (
            <GenerateCertButton companyName={companyName} job={jobPosition} />
          ) : (
            <p className="text-gray-500 text-sm text-center mt-4">
              Company or job details not available
            </p>
          )}
        </div>
      </div>

      {/* Right Column: Reports */}
      <div className="col-span-2">
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100 transform hover:scale-101 transition-all duration-300 h-full">
          <h3 className="text-xl font-bold mb-6 text-gray-900 text-center bg-blue-50 p-4 rounded-xl">Reports</h3>
          <ReportsSubmitted onEdit={handleEditReport} onRemove={handleRemoveReport} />
        </div>
      </div>

      {/* Modals */}
      <WeeklyReport
        isOpen={isWeeklyReportModalOpen}
        onClose={() => {
          setIsWeeklyReportModalOpen(false);
          setEditingReport(null);
        }}
        editingReport={editingReport}
      />
      <WeeklyJournal isOpen={isWeeklyJournalModalOpen} onClose={() => setIsWeeklyJournalModalOpen(false)} />
      <MonthlyReport isOpen={isMonthlyReportModalOpen} onClose={() => setIsMonthlyReportModalOpen(false)} />
    </div>
  );
};

export default ReportSide;