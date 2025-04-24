import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import CompanyApplication from "../components/CompanyApplication";
import OJTLogo from "/src/assets/ojt-logo-dashboard.svg";
import { Search, X, User, Settings, CircleHelp, LogOut } from "lucide-react";
import { Loading } from "../components/Loading";

interface Company {
  company_id: string;
  name: string;
  address: string;
  email: string;
  contact_no: string;
  logo_url: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasApprovedApplication, setHasApprovedApplication] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("student"); // Default role

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
        navigate("/");
        return;
      }

      // Set user metadata
      const fullname = user.user_metadata?.full_name || "User";
      setUserName(fullname);
      setProfilePicture(user.user_metadata?.avatar_url || null);
      // Set user role dynamically from metadata
      setUserRole(user.user_metadata?.role || "student"); // Now using setUserRole

      // Check if user exists before inserting
      const { data: existingUser } = await supabase
        .from("user")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!existingUser) {
        const { error: insertError } = await supabase.from("user").insert({
          user_id: user.id,
          name: fullname,
          email: user.email,
          date_registered: new Date().toISOString(),
          course: null,
          profilePicture: user.user_metadata?.avatar_url,
        });

        if (insertError) {
          console.error("Error inserting user:", insertError);
        }
      }

      // Check for existing application
      const { data: applicationData } = await supabase
        .from("application")
        .select("application_id, status")
        .eq("user_id", user.id)
        .single();

      if (applicationData) {
        setApplicationId(applicationData.application_id);
        setHasApprovedApplication(applicationData.status === "approved");
      }

      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from("company").select("*");
      if (data) {
        setCompanies(data);
      }
      if (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!applicationId) return;

    const subscription = supabase
      .channel("application_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "application",
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          setHasApprovedApplication(payload.new.status === "approved");
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [applicationId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
        <img src={OJTLogo} alt="Ojt Logo" className="w-[220px] h-[220px] ml-4" />

        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
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
          <div className="absolute right-0 top-16 bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem]">
            <div className="bg-blue-800 text-white p-4 text-center">
              <div className="w-16 h-16 rounded-full mx-auto overflow-hidden mb-2">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 mx-auto text-white" />
                )}
              </div>
              <p className="font-semibold">{userName}</p>
              <p className="text-xs text-violet-200">{userRole}</p>
            </div>
            <ul className="text-sm">
              <li>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setIsProfileOpen(false);
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
                    onClick={() => navigate("/admin")}
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
      </div>

      {/* Companies Section */}
      <div className="w-screen min-h-screen bg-[linear-gradient(to_bottom,#091545_1%,#1735AB_59%)] flex flex-col items-center p-28">
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

        <h2 className="text-5xl font-bold text-center text-white p-8">Explore Companies</h2>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-9 mt-6">
          {filteredCompany.map((company) => (
            <div key={company.company_id} className="w-full">
              <div
                onClick={() => setSelectedCompany(selectedCompany === company ? null : company)}
                className="h-full min-h-[220px] border rounded-2xl shadow-[0_0_15px_4px_rgba(169,162,255,0.5)] p-8 bg-white cursor-pointer flex flex-col xustify-between transform transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_6px_rgba(169,162,255,0.7)] z-10"
              >
                <div className="w-30 h-30 rounded border flex items-center justify-center overflow-hidden flex-shrink-0 mr-4">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={`${company.name} logo`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <span className="text-gray-500">Logo</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between">
                  <h2 className="text-2xl text-gray-600 font-semibold mb-3">{company.name}</h2>
                  <p className="text-gray-600 text-base break-words mb-3">
                    {company.address} - <span className="block">{company.email}</span>
                  </p>
                  <p className="text-gray-700 text-lg mt-auto">{company.contact_no}</p>
                </div>
              </div>

              {selectedCompany === company && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  <div className="bg-[#FDFBF6] p-6 rounded-lg shadow-lg w-full max-w-[100vh] h-[60vh] overflow-y-auto overflow-x-hidden relative z-50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[1.5rem] font-bold text-black sticky top-0">{company.name}</h3>
                      <button onClick={() => setSelectedCompany(null)} className="bg-black">
                        <X size={15} color="white" />
                      </button>
                    </div>
                    <CompanyApplication
                      company={company}
                      onClose={() => setSelectedCompany(null)}
                      hasApprovedApplication={hasApprovedApplication}
                      applicationId={applicationId}
                    />
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