import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { File } from "lucide-react";
import { supabase } from "../../supabase";
import logo from "../assets/ojt-link-logo FINAL.png";
import WeeklyReport from "../components/WeeklyReport";

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [jobPosition, setJobPosition] = useState<string | null>(null);

  const [isWeeklyReportModalOpen, setIsWeeklyReportModalOpen] = useState(false);
  const [isWeeklyJournalModalOpen, setIsWeeklyJournalModalOpen] = useState(false);  //Do not merge with Vercel yet
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);  //Do not merge with Vercel yet, it will cause error

  const templates = [
    { name: "Weekly Report", file: "WeeklyReport_Surname.pdf" },
    { name: "Weekly Journal", file: "WeeklyJournal_Surname.pdf" },
    { name: "Monthly Report", file: "MonthlyReport_Surname.pdf" },
  ];

  const reports = [
    { week: 1, dueDate: "March 16, 2025", status: "Submitted" },
    { week: 2, dueDate: "March 23, 2025", status: "Pending" },
    { week: 3, dueDate: "March 30, 2025", status: "Pending" },
  ];

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("User not found:", userError?.message);
        return;
      }
      const { data: application, error: applicationError } = await supabase
        .from("application")
        .select("company_id, job_id")
        .eq("user_id", userData.user.id)
        .eq("status", "approved")
        .single();

      if (applicationError || !application) {
        console.error("No approved application found:", applicationError?.message);
        return;
      }

      const { company_id, job_id } = application;

      // Fetch the company name
      const { data: company, error: companyError } = await supabase
        .from("company")
        .select("name")
        .eq("company_id", company_id)
        .single();

      if (companyError || !company) {
        console.error("Company not found:", companyError?.message);
        return;
      }

      // Fetch the job position
      const { data: job, error: jobError } = await supabase
        .from("job")
        .select("position")
        .eq("job_id", job_id)
        .single();

      if (jobError || !job) {
        console.error("Job position not found:", jobError?.message);
        return;
      }

      setCompanyName(company.name);
      setJobPosition(job.position);
    };

    fetchApplicationDetails();
  }, []);

  const handleDownload = async (fileName: string) => {
    setLoading(fileName);
    setError(null);
  
    const { data, error } = await supabase.storage.from("templates").download(fileName);
    
    if (error) {
      console.error("Download error:", error);
      setError(`Failed to download ${fileName}: ${error.message}`);
    } else {
      console.log("Downloaded file:", fileName);
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

  const handleNavigateToSubmission = (reportType: string) => {
    const routes: { [key: string]: string } = {
      "Weekly Report": "/weekly-report",
      "Weekly Journal": "/weekly-journal",
      "Monthly Report": "/monthly-report",
    };
    navigate(routes[reportType]);
  };

  const handleOpenSubmissionModal = (reportType: string) => {
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

  const fetchReport = async (week: number) => { 
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      alert("User not logged in");
      return;
    }

    const { data, error } = await supabase
      .from("weekly_report")
      .select("file_url")
      .eq("submitted_by", user.user_metadata?.name)
      .eq("week_number", week)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      alert(`No report found for Week ${week}.`);
      return;
    }

    const filePath = data.file_url.startsWith("https://")
      ? data.file_url.split("/weekly_reports/").pop()
      : data.file_url;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("weekly_reports")
      .createSignedUrl(filePath, 60);

    if (signedUrlError || !signedUrlData) {
      alert("Failed to fetch report securely.");
      return;
    }

    window.open(signedUrlData.signedUrl, "_blank");
};



  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-md z-50 border-b border-black">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="OJT Link Logo" />
          <button className="bg-blue-100 text-black px-4 py-2 rounded">HOME</button>
          <span className="text-lg font-semibold">Explore Jobs</span>
        </div>
        <button className="bg-white text-black p-2 rounded-full border border-black">X</button>
      </header>

      <div className="container mx-auto px-6 mt-35">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 border border-black">
            <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500">Logo</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {companyName || "Loading company..."}
              </h2>
              <p className="text-sm text-gray-600">
                {jobPosition || "Loading position..."}
              </p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-lg font-semibold mb-2">Work Days</h3>
            <p className="mb-1">June 1, 2025 - August 1, 2025</p>
            <p>Monday-Friday: 9:00AM - 5:00PM</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-lg font-semibold mb-2">Supervisors</h3>
            <div className="space-y-2">
              <div><span className="font-semibold">Supervisor:</span> Vincent Smith</div>
              <div><span className="font-semibold">OJT Coordinator:</span> John Doe</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-lg font-semibold mb-2">Templates</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.file}
                  className={`flex items-center space-x-2 cursor-pointer ${loading === template.file ? "text-gray-400" : "hover:text-blue-500"}`}
                  onClick={() => handleDownload(template.file)}
                >
                  <File className="text-gray-500" />
                  <span>{loading === template.file ? "Downloading..." : template.name}</span>
                </div>
              ))}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-lg font-semibold mb-2">Submissions</h3>
            <div className="space-y-2">
                {templates.map((template) => (
                <button
                    key={template.file}
                    onClick={() => handleOpenSubmissionModal(template.name)}
                    className="w-full bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200 flex items-center justify-start"
                >
                    <File className="mr-2" />
                    {template.name}
                </button>
                ))}
            </div>
        </div>
        <WeeklyReport isOpen={isWeeklyReportModalOpen} onClose={() => setIsWeeklyReportModalOpen(false)} />
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-lg font-semibold mb-2">Reports Submitted</h3>
            <div className="space-y-2">
                {reports.map((report) => (
                    <div
                    key={report.week}
                    onClick={() => fetchReport(report.week)}
                    className={`cursor-pointer flex justify-between items-center p-2 rounded ${
                        report.status === "Submitted"
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "bg-gray-50"
                    } border border-black`}
                    >
                    <div>
                        <div className="font-semibold">Week {report.week} Report</div>
                        <div className="text-sm text-gray-600">Due: {report.dueDate}</div>
                    </div>
                    {report.status === "Submitted" && (
                        <div className="text-green-600 font-semibold">Submitted</div>
                    )}
                    </div>
                ))}
                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
