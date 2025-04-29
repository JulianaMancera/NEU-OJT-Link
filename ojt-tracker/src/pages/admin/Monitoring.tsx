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
  totalHours: number | null;
  lastReportDate: string | null;
  isActive: boolean;
};

const Monitoring = () => {
  const [applications, setApplications] = useState<Monitoring[]>([]);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data: rawApps, error } = await supabase
          .from("application")
          .select("*")
          .eq("status", "approved");

        if (error) throw error;

        const monitoring = await Promise.all(
          (rawApps || []).map(async (app) => {
            const { data: userData } = await supabase
              .from("user")
              .select("name, profilePicture")
              .eq("user_id", app.user_id)
              .single();

            const { data: companyData } = await supabase
              .from("company")
              .select("name")
              .eq("company_id", app.company_id)
              .single();

            const { data: jobData } = await supabase
              .from("job")
              .select("position")
              .eq("job_id", app.job_id)
              .single();

            const { data: reportsData } = await supabase
              .from("weeklyReports")
              .select("number_of_hours, date_submitted")
              .eq("user_id", app.user_id);

              const { data: userHoursData } = await supabase
              .from("user_hours")
              .select("total_hours")
              .eq("user_id", app.user_id)
              .single();
            
            const totalHours = userHoursData?.total_hours || null;            

            const lastReportDate = reportsData?.length
              ? reportsData
                  .map((r) => new Date(r.date_submitted))
                  .sort((a, b) => b.getTime() - a.getTime())[0]
                  .toLocaleDateString()
              : null;

            return {
              ...app,
              userName: userData?.name || "Unknown",
              profilePicture: userData?.profilePicture || null,
              companyName: companyData?.name || "Unknown",
              jobPosition: jobData?.position || "Unknown",
              totalHours,
              lastReportDate,
            };
          })
        );

        setApplications(monitoring);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        setMessage("❌ Failed to load application data.");
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
        {/* Search bar */}
        <input
            type="text"
            placeholder="Search by username..."
            className="border border-gray-400 bg-white text-black rounded px-4 py-2 text-sm w-full sm:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Company dropdown */}
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
  
        {/* Table Header */}
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
        .map((app) => {
          const required = 300;
          const left = app.totalHours === null ? "Not Started" : Math.max(0, required - (app.totalHours || 0));
          const status = app.isActive ? "Active" : "Inactive"; // Display Active/Inactive based on isActive

          return (
            <div
              key={app.application_id}
              className="grid grid-cols-12 items-center p-2 text-black border-b border-gray-300 text-sm"
            >
              {/* Profile picture and name */}
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
              <div className="col-span-1 text-center">300</div>
              <div className="col-span-1 text-center">{left}</div>
              <div className="col-span-1 text-center">{status}</div> {/* Display Status */}
              <div className="col-span-2 text-center">
                {app.lastReportDate ? new Date(app.lastReportDate).toLocaleDateString() : "N/A"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Monitoring;