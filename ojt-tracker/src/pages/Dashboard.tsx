import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import CompanyApplication from "../components/CompanyApplication";

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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
        <div>
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
            onClick={() => navigate("/weekly-report")}
          >
            Submit Weekly Report
          </button>
          <button 
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {user && <p className="mt-4">Logged in as: {user.user_metadata?.full_name}</p>}

      {/* Companies Section */}
      <h2 className="text-3xl font-bold text-center mt-8 mb-6">Explore Companies</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div 
            key={company.company_id} 
            onClick={() => setSelectedCompany(company)} 
            className="border rounded-lg shadow-md p-6 bg-white cursor-pointer hover:shadow-lg transition"
          >
            <h2 className="text-xl text-gray-600 font-semibold">{company.name}</h2>
            <p className="text-gray-600">{company.address} - {company.email}</p>
            <p className="text-gray-700 mt-2">{company.contact_no}</p>
          </div>
        ))}
      </div>

      {/* Show Company Details When Selected */}
      {selectedCompany && (
        <CompanyApplication company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
};

export default Dashboard;