import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import CompanyApplication from "../components/CompanyApplication";
import OJTLogo from "/src/assets/ojt-logo-dashboard.svg";
import { Search, X } from "lucide-react";

interface Company {
  company_id: string;
  name: string;
  address: string;
  email: string;
  contact_no: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user || !user.email?.endsWith("@neu.edu.ph")) {
        navigate("/"); // Redirect to login if not authorized
      } else {
        const fullname = user.user_metadata?.full_name || "User";
        const { error } = await supabase.from("user").insert({
          user_id: user.id,
          name: fullname,
          email: user.email,
          date_registered: new Date().toISOString(),
          course: null
        });

        if (error) console.error("Error inserting user:", error);
        console.log("User creation success");

        setUser(user);
        setLoading(false);
      }
    };

    const checkApplicationStatus = async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data, error } = await supabase
          .from("application")
          .select("status")
          .eq("user_id", user.data.user.id)
          .single();

      if (error) {
          console.error("Error fetching application status:", error.message);
          return;
      }

      if (data?.status === "approved") {
          navigate("/student-dashboard");
      }
  };
  checkApplicationStatus();

    const fetchCompanies = async () => {
      const { data, error } = await supabase.from("company").select("*");

      if (error) {
        console.error("Error fetching companies:", error.message);
      } else {
        console.log("Fetched companies:", data);
        setCompanies(data);
      }
    };

    fetchUser();
    fetchCompanies();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/"); // Redirect to login after logout
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
  
      {/*logo bigger */}
      <img 
        src={OJTLogo} 
        alt="Ojt Logo" 
        className="w-[220px] h-[220px] ml-4"
      />

      {/* Center logged-in text*/}
      {user && (
        <p className="text-white text-lg font-semibold absolute left-1/2 transform -translate-x-1/2">
          Logged in as: {user.user_metadata?.full_name}
        </p>
      )} 

    <div className="flex space-x-4">
      {/*<button 
        className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        onClick={() => navigate("/weekly-report")}
      >
        Submit Weekly Report
      </button> */}
      <button 
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  </div>


      {/* Companies Section */}
      <div className="w-screen min-h-screen bg-gradient-to-b from-[#D0E8FF] to-[#FFFFFF] flex flex-col items-center p-28">
      {/* Search Section */}
      <div className="relative w-[520px] h-12 bg-[#fcfbf4]/75 border-2 border-black flex items-center px-4 mb-10">
        <span className="text-[#716969] text-2xl font-normal font-inter">
          Job title, keyword, or company
        </span>
        <div className="absolute right-4">
          <Search size={24} color="black"/>
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-4xl font-bold text-center text-black mt-6">Explore Companies</h2>

        {/* Company Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {companies.map((company) => (
          <div key={company.company_id} className="w-full">
            {/* Company Card */}
            <div
              onClick={() => setSelectedCompany(selectedCompany === company ? null : company)}
              className="border rounded-lg shadow-[0_0_15px_4px_rgba(169,162,255,0.5)] p-6 bg-white cursor-pointer"
            >
              <h2 className="text-xl text-gray-600 font-semibold">{company.name}</h2>
              <p className="text-gray-600">{company.address} - {company.email}</p>
              <p className="text-gray-700 mt-2">{company.contact_no}</p>
            </div>

            {/* Expanded Company Details (if selected) */}
            {selectedCompany === company && (
              <div className="border mt-2 p-6 bg-white rounded-lg shadow-lg">
                {/* Close Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-black">{company.name}</h3>
                  <button onClick={() => setSelectedCompany(null)}>
                    <X size={24} color="white" />
                  </button>
                </div>


                {/* Company Application Component Inside Expanding Box */}
                <CompanyApplication company={company} onClose={() => setSelectedCompany(null)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default Dashboard;