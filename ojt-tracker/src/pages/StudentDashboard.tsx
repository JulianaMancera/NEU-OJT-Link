import React, { useState, useEffect } from "react";
import { File } from "lucide-react";
import { supabase } from "../../supabase";
import logo from "../assets/ojt-logo-dashboard.svg";
import WeeklyReport from "../components/WeeklyReport";
import WeeklyJournal from "../components/WeeklyJournal";
import MonthlyReport from "../components/MonthlyReport";

import { User, Settings, LogOut, CircleHelp, UserSquare2} from "lucide-react";

import { useNavigate } from "react-router-dom";
import ReportsSubmitted from "../components/ReportsSubmitted";

interface WorkDay {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface Report {
  weekly_report_id: number;
  week_number: number;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [jobPosition, setJobPosition] = useState<string | null>(null);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isWeeklyReportModalOpen, setIsWeeklyReportModalOpen] = useState(false);
  const [isWeeklyJournalModalOpen, setIsWeeklyJournalModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  const templates = [
    { name: "Weekly Report", file: "WeeklyReport_Surname.pdf" },
    { name: "Weekly Journal", file: "WeeklyJournal_Surname.pdf" },
    { name: "Monthly Report", file: "MonthlyReport_Surname.pdf" },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "User");
        const { data: roleData } = await supabase
          .from("user")
          .select("role, profilePicture")
          .eq("user_id", user.id)
          .single();

        if (roleData) {
          setUserRole(roleData.role);
          setProfilePicture(roleData.profilePicture);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/"); // Redirect to login after logout
  };

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("User not found:", userError?.message);
        return;
      }

      const { data: application, error: applicationError } = await supabase
        .from("application")
        .select("company_id, job_id, application_id")
        .eq("user_id", userData.user.id)
        .eq("status", "approved")
        .single();

      if (applicationError || !application) {
        console.error("No approved application found:", applicationError?.message);
        return;
      }

      const { company_id, job_id, application_id } = application;

      const { data: company, error: companyError } = await supabase
        .from("company")
        .select("name, logo_url")
        .eq("company_id", company_id)
        .single();

      if (companyError || !company) {
        console.error("Company not found:", companyError?.message);
        return;
      }

      const { data: job, error: jobError } = await supabase
        .from("job")
        .select("position")
        .eq("job_id", job_id)
        .single();

      if (jobError || !job) {
        console.error("Job position not found:", jobError?.message);
        return;
      }

      setCompanyLogo(company.logo_url);
      setCompanyName(company.name);
      setJobPosition(job.position);
      await fetchWorkDays(application_id);
    };

    fetchApplicationDetails();
  }, []);

  const fetchWorkDays = async (applicationId: string) => {
    const { data, error } = await supabase
      .from("availability")
      .select("day_of_week, start_time, end_time")
      .eq("application_id", applicationId)
      .order("day_of_week");

    if (error) {
      console.error("Error fetching work days:", error.message);
      return;
    }

    if (data && data.length > 0) {
      const formattedWorkDays = data.map(day => ({
        day_of_week: day.day_of_week,
        start_time: formatTime(day.start_time),
        end_time: formatTime(day.end_time)
      }));

      setWorkDays(formattedWorkDays);
    }
  };

  const formatTime = (time24: string): string => {
    const timeParts = time24.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];

    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;

    return `${formattedHours}:${minutes} ${period}`;
  };

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
    setEditingReport(null); // Reset editing state when opening new submission
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

  const sortDaysOfWeek = (days: WorkDay[]): WorkDay[] => {
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return [...days].sort((a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week));
  };

  const handleEditReport = async (week: number) => {
    // Fetch the report ID for the given week
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
    // You can add additional logic here if needed
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#D0E8FF] p-6">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full h-[80px] bg-gradient-to-b from-[#578FCA] to-[#2B4764] text-white px-6 py-4 flex items-center justify-between shadow-md z-50 border-b border-black">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="OJT Link Logo" className="w-[220px] h-[220px]"/>
          <button className="bg-blue-100 text-black px-4 py-2 rounded">HOME</button>
          <span className="text-lg font-semibold">Explore Jobs</span>
        </div>
        <button 
        onClick={() => setProfileOpen(!isProfileOpen)}
        className="relative p-2 hover:bg-violet-100 rounded-full transition-colors overflow-hidden"
    >
        {profilePicture ? (
            <img
                src={profilePicture}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
            />
        ) : (

            <User className="w-6 h-6 text-blue-800" />

        )}
    </button>

    {isProfileOpen && (

        <div className="absolute right-0 top-21 bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem] ">
            <div className="bg-blue-800 text-black p-4 text-center">

                <div className="w-16 h-16 rounded-full mx-auto overflow-hidden mb-2">
                    {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-8 h-8 mx-auto text-black" />
                    )}
                </div>
                <p className="font-semibold">{userName}</p>
                <p className="text-xs text-black-200 capitalize">{userRole}</p>
            </div>
            <ul className="text-sm">
                <li>
                    <button 
                        onClick={() => {
                            navigate('/profile');
                            setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                    >
                        <User className="w-4 h-4 mr-2" /> Profile
                    </button>
                </li>
                <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </button>
                </li>
                <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                        <CircleHelp className="w-4 h-4 mr-2" /> Help & Support
                    </button>
                </li>
                {userRole === "admin" && (
                    <li>
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                        >
                            🛠️ Admin
                        </button>
                    </li>
                )}
                <li>
                    <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 flex items-center"
                    >
                        <LogOut className="w-4 h-4 mr-2" /> Log out
                    </button>
                </li>
            </ul>
        </div>
    )}
      </header>

      <div className="container mx-auto px-6 mt-35 text-black">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 border border-black">
            <div className="w-20 h-20 rounded border border-black flex items-center justify-center overflow-hidden flex-shrink-0">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={`${companyName} logo`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <span className="text-gray-500">Logo</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-[1.2rem] font-semibold">
                {companyName || "Loading company..."}
              </h2>
              <p className="text-[.8rem] text-gray-600">
                {jobPosition || "Loading position..."}
              </p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-lg font-semibold mb-2 text-center">Work Days</h3>          
            {workDays.length > 0 ? (
              <div className="space-y-1">
                {sortDaysOfWeek(workDays).map((day, index) => (
                  <p key={index}>
                    {day.day_of_week}: {day.start_time} - {day.end_time}
                  </p>
                ))}
              </div>
            ) : (
              <p>Loading work schedule...</p>
            )}
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-lg font-semibold mb-2 text-center">Supervisors</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2"><UserSquare2 size={25} color="black"/><span className="font-semibold">Supervisor:</span>Vincent Smith</div>
              <div className="flex items-center gap-2"><UserSquare2 size={25} color="black"/><span className="font-semibold">OJT Coordinator:</span> John Doe</div>           
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-[1.1rem] font-semibold mb-5 text-center bg-[#D0E8FF] p-6 w-full h-2 flex justify-center items-center">Templates</h3>
            <div className="space-y-7">
              {templates.map((template) => (
                <div
                  key={template.file}
                  className={`flex items-center bg-gray-300 py-2 px-4 rounded hover:bg-gray-300 max-w-46 gap-2 mx-auto transition-colors font-semibold ${loading === template.file ? "text-gray-400" : "hover:text-blue-500"}`}
                  onClick={() => handleDownload(template.file)}
                >
                  <File className="text-black-500" />
                  <span>{loading === template.file ? "Downloading..." : template.name}</span>
                </div>
              ))}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 border border-black">
            <h3 className="text-[1.1rem] font-semibold mb-4 text-center bg-[#D0E8FF] p-6 w-full h-2 flex justify-center items-center">Submissions</h3>
            <div className="space-y-5">
                {templates.map((template) => (
                <button
                    key={template.file}
                    onClick={() => handleOpenSubmissionModal(template.name)}
                    className="w-full bg-black-100 text-black-600 p-2 rounded hover:bg-[#A1E3F9] flex items-center justify-start bg-[#A1E3F9]"
                >
                    <File className="mr-2" />
                    {template.name}
                </button>
                ))}
            </div>
        </div>
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
        <ReportsSubmitted 
            onEdit={handleEditReport}
            onRemove={handleRemoveReport}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;