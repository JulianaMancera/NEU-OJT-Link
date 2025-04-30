import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "../../components/SideBar";
import { MessageNotification } from "../../components/MessageNotification";

type Application = {
  application_id: number;
  user_id: string;
  job_id: number;
  company_id: string;
  status: string;
  date_applied: string;
};

type Monitoring = Application & {
  userName: string;
  profilePicture: string | null;
  companyName: string;
  jobPosition: string;
  hoursCompleted: number;
  hoursLeft: number;
  lastReportDate: string | null;
  status: "Active" | "Inactive" | "No Reports";
};

const Monitoring = () => {
  const [applications, setApplications] = useState<Monitoring[]>([]);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  // Function to format date in Philippine time (MM-DD-YY HH:MM AM/PM)
  const formatPhilippineDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Function to check if a date is within the past week
  const isWithinPastWeek = (dateString: string) => {
    const reportDate = new Date(dateString);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return reportDate >= oneWeekAgo;
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data: rawApps, error: appsError } = await supabase
          .from("application")
          .select("*")
          .eq("status", "approved");

        if (appsError) throw appsError;
        if (!rawApps || rawApps.length === 0) return;

        const userIds = rawApps.map(app => app.user_id);
        const companyIds = [...new Set(rawApps.map(app => app.company_id))];
        const jobIds = [...new Set(rawApps.map(app => app.job_id))];

        // Fetch users
        const { data: usersData } = await supabase
          .from("user")
          .select("user_id, name, profilePicture")
          .in("user_id", userIds);

        // Fetch companies
        const { data: companiesData } = await supabase
          .from("company")
          .select("company_id, name")
          .in("company_id", companyIds);

        // Fetch jobs
        const { data: jobsData } = await supabase
          .from("job")
          .select("job_id, position")
          .in("job_id", jobIds);

        // Fetch hours logs with timestamps
        const { data: hoursLogsData } = await supabase
          .from("hours_logs")
          .select("user_id, hours, logged_at")
          .in("user_id", userIds)
          .order("logged_at", { ascending: false });

        // Process applications
        const monitoring = rawApps.map(app => {
          const user = usersData?.find(u => u.user_id === app.user_id);
          const company = companiesData?.find(c => c.company_id === app.company_id);
          const job = jobsData?.find(j => j.job_id === app.job_id);

          const userHoursLogs = hoursLogsData?.filter(log => log.user_id === app.user_id) || [];
          const hoursCompleted = userHoursLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
          const hoursLeft = Math.max(0, 300 - hoursCompleted);
          const latestLog = userHoursLogs[0];
          const lastReportDate = latestLog?.logged_at || null;
          
          // Determine status
          let status: "Active" | "Inactive" = "Inactive";
          if (lastReportDate) {
            status = isWithinPastWeek(lastReportDate) ? "Active" : "Inactive";
          }

          return {
            ...app,
            userName: user?.name || "Unknown",
            profilePicture: user?.profilePicture || null,
            companyName: company?.name || "Unknown",
            jobPosition: job?.position || "Unknown",
            hoursCompleted,
            hoursLeft,
            lastReportDate,
            status
          };
        });

        setApplications(monitoring);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        setMessage("Failed to load application data");
        setTimeout(() => setMessage(""), 3000);
      }
    };

    fetchApplications();
  }, []);

  return (
    <div className="relative min-h-screen w-screen bg-blue-100 p-6">
      {/* Header */}
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border border-black flex items-center justify-between px-6" />
  
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="mt-[90px] mb-2 flex flex-col sm:flex-row items-center justify-center gap-4 px-4 z-10 relative">
        <input
          type="text"
          placeholder="Search by username..."
          className="border border-gray-400 bg-white text-black rounded px-4 py-2 text-sm w-full sm:w-64"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="border border-gray-400 bg-white text-black rounded px-4 py-2 text-sm w-full sm:w-64"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="">All Companies</option>
          {[...new Set(applications.map((a) => a.companyName))].map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 bg-white border border-black rounded-lg p-6 max-w-7xl mx-auto">
        <MessageNotification message={message} />
  
        <div className="flex justify-center mb-6">
          <h2 className="text-[1.8rem] font-bold text-black">Monitoring</h2>
        </div>
  
        <div className="grid grid-cols-12 font-semibold p-2 rounded text-black border-2 bg-[#E8E8E8] text-sm">
          <div className="col-span-3 ml-4">Name</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-2">Position</div>
          <div className="col-span-1 text-center">Hours Required</div>
          <div className="col-span-1 text-center">Hours Left</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-center">Last Report</div>
        </div>
  
        {applications
          .filter((app) =>
            app.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (companyFilter === "" || app.companyName === companyFilter)
          )
          .map((app) => (
            <div
              key={app.application_id}
              className="grid grid-cols-12 items-center p-2 text-black border-b border-gray-300 text-sm"
            >
              <div className="col-span-3 ml-4 flex items-center space-x-2">
                {app.profilePicture ? (
                  <img
                    src={app.profilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-gray-400"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm text-white">
                    ?
                  </div>
                )}
                <span>{app.userName}</span>
              </div>
  
              <div className="col-span-2">{app.companyName}</div>
              <div className="col-span-2">{app.jobPosition}</div>
              <div className="col-span-1 text-center">300 hours</div>
              <div className="col-span-1 text-center">
                {app.hoursLeft} hours
              </div>
              <div className={`col-span-1 text-center ${
                app.status === "Active" ? "text-green-600" : 
                app.status === "Inactive" ? "text-red-600" : "text-gray-600"
              }`}>
                {app.status}
              </div>
              <div className="col-span-2 text-center">
                {app.lastReportDate 
                  ? formatPhilippineDateTime(app.lastReportDate)
                  : "No submitted report"}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Monitoring;