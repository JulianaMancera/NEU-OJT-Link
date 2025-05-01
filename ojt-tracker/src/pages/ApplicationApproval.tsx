import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { User } from "@supabase/supabase-js";
import Sidebar from "../components/SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { Loading } from "../components/Loading";

interface Application {
  application_id: string;
  user_id: string;
  company_id: string;
  email: string;
  status: 'approved' | 'pending' | 'rejected';
}

const ApplicationApproval = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<(Application & { user_name?: string; company_name?: string })[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Authentication error:", userError);
        setLoading(false);
        return;
      }

      setUser(user);

      const { data, error } = await supabase.from("application").select("*");

      if (error) {
        console.error("Error fetching applications:", error.message);
        setLoading(false);
        return;
      }

      const fetchNames = await Promise.all(data.map(async (app) => {
        const { data: userData } = await supabase
          .from("user")
          .select("name")
          .eq("user_id", app.user_id)
          .single();

        const { data: companyData } = await supabase
          .from("company")
          .select("name")
          .eq("company_id", app.company_id)
          .single();

        return {
          ...app,
          user_name: userData?.name || 'Unknown',
          company_name: companyData?.name || 'Unknown'
        };
      }));

      setApplications(fetchNames);
      setLoading(false);
    };

    fetchApplications();
  }, []);

  const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const { error } = await supabase
      .from("application")
      .update({ status: newStatus })
      .eq('application_id', applicationId);

    if (error) {
      console.error("Error updating application status:", error.message);
    } else {
      setApplications(applications.map(app => 
        app.application_id === applicationId 
          ? { ...app, status: newStatus } 
          : app
      ));
    }
  };

  if (loading) return <Loading />;

  if (!user) {
    return <p className="text-center mt-10">Please log in to view applications</p>;
  }

  return (
    <div>
      <div className="bg-blue-200 w-screen h-screen p-20">
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
      <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
      </div>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
        <h2 className="text-[2.3rem] font-bold text-center mb-10 mt-12 text-black">
          Application Approvals
        </h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-black">
              <th className="border p-2">Application ID</th>
              <th className="border p-2">Username</th>
              <th className="border p-2">Company Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.application_id} className="hover:bg-gray-300 text-black bg-white">
                <td className="border p-2">{application.application_id}</td>
                <td className="border p-2">{application.user_name}</td>
                <td className="border p-2">{application.company_name}</td>
                <td className="border p-2">{application.email}</td>
                <td className="border p-2">
                  <select
                    value={application.status}
                    onChange={(e) => handleStatusChange(
                      application.application_id, 
                      e.target.value as Application['status']
                    )}
                    className="w-full p-1 font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationApproval;