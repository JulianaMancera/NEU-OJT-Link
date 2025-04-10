import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompany = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user || !user.email?.endsWith("@neu.edu.ph")) {
        navigate("/"); // Redirect to login if not authorized
      } else {
        const fullname = user.user_metadata?.full_name || "User";
        const { error } = await supabase.from("user").insert({
          user_id: user.id,
          name: fullname,
          email: user.email,
          date_registered: new Date().toISOString(),
          course: null,
          profilePicture: user.user_metadata?.avatar_url,
        });

        if (error) console.error("Error inserting user:", error);
        console.log("User creation success");

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
        <img src={OJTLogo} alt="Ojt Logo" className="w-[220px] h-[220px] ml-4" />

        <div className="flex space-x-4">
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Companies Section */}
      <div className="w-screen min-h-screen bg-[linear-gradient(to_bottom,#091545_1%,#1735AB_59%)] flex flex-col items-center p-28">
        {/* Search Section */}
        <div className="relative w-full max-w-xl h-12 bg-[#fcfbf4]/85 border-2 border-black flex items-center px-5 mb-6">
          <input
            type="text"
            placeholder="Company Name or Location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[#716969] text-base sm:text-lg"
          />
          <div className="absolute right-4">
            <Search size={25} color="black" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-5xl font-bold text-center text-white p-8">Explore Companies</h2>

        {/* Company Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-9 mt-6">
          {filteredCompany.map((company) => (
            <div key={company.company_id} className="w-full">
              {/* Company Card */}
              <div
                onClick={() => setSelectedCompany(selectedCompany === company ? null : company)}
                className="h-full min-h-[220px] border rounded-2xl shadow-[0_0_15px_4px_rgba(169,162,255,0.5)] p-8 bg-white cursor-pointer flex flex-col justify-between transform transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_6px_rgba(169,162,255,0.7)] z-10"
              >
                <h2 className="text-2xl text-gray-600 font-semibold mb-3">{company.name}</h2>

                <p className="text-gray-600 text-base break-words mb-3">
                  {company.address} - <span className="block">{company.email}</span>
                </p>

                <p className="text-gray-700 text-lg mt-auto">{company.contact_no}</p>
              </div>

              {/* Expanded Company Details (if selected) */}
              {selectedCompany === company && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  <div className="bg-[#FDFBF6] p-6 rounded-lg shadow-lg w-full max-w-[80vh] h-[60vh] overflow-y-auto overflow-x-hidden relative z-50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-black sticky top-0">{company.name}</h3>
                      <button onClick={() => setSelectedCompany(null)}>
                        <X size={15} color="white" />
                      </button>
                    </div>

                    {/* Company Application Component Inside Expanding Box */}
                    <CompanyApplication company={company} onClose={() => setSelectedCompany(null)} />
                  </div>
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