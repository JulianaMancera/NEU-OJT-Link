import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "../../components/SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { User, Settings, CircleHelp, LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Company {
  company_id: string;
  name: string;
  address: string;
  email: string;
  contact_no: string;
  logo_url: string;
  start_time: string | null;
  end_time: string | null;
  companyRestrict: 'Active' | 'Restricted';
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '',
    address: '',
    email: '',
    contact_no: '',
    start_time: null,
    end_time: null,
    companyRestrict: 'Active',
  });
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Placeholder user data (replace with actual auth data from Supabase)
  const [userName, setUserName] = useState<string>("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user")
          .select("name, role, profilePicture")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setUserName(data.name || "Unknown");
          setUserRole(data.role || "user");
          setProfilePicture(data.profilePicture);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out");
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    // Filter companies based on search query
    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter((company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.from("company").select("*");
      if (error) throw new Error(error.message);
      setCompanies(data || []);
      setFilteredCompanies(data || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Failed to load companies");
    }
  };

  const handleFileUpload = async (): Promise<string> => {
    if (!logoFile) return newCompany.logo_url || "";

    try {
      const fileName = `${Date.now()}_${logoFile.name}`;
      const { error } = await supabase.storage
        .from("logos")
        .upload(fileName, logoFile, {
          contentType: logoFile.type,
          upsert: true,
        });

      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload logo");
      return "";
    }
  };

  const handleAddOrUpdateCompany = async () => {
    try {
      const logo_url = await handleFileUpload();

      const companyData = {
        ...newCompany,
        logo_url,
        companyRestrict: newCompany.companyRestrict || 'Active',
      };

      if (editingCompanyId) {
        const { error } = await supabase
          .from("company")
          .update(companyData)
          .eq("company_id", editingCompanyId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("company").insert([companyData]);
        if (error) throw new Error(error.message);
      }

      setNewCompany({ name: '', address: '', email: '', contact_no: '', start_time: null, end_time: null, companyRestrict: 'Active' });
      setLogoFile(null);
      setEditingCompanyId(null);
      setIsModalOpen(false);
      setError(null);
      fetchCompanies();
    } catch (err) {
      console.error("Company operation error:", err);
      setError("Failed to save company");
    }
  };

  const handleEdit = (company: Company) => {
    setNewCompany(company);
    setEditingCompanyId(company.company_id);
    setIsModalOpen(true);
  };

  const handleNewCompany = () => {
    setNewCompany({ name: '', address: '', email: '', contact_no: '', start_time: null, end_time: null, companyRestrict: 'Active' });
    setEditingCompanyId(null);
    setIsModalOpen(true);
  };

  const handleRestrictCompany = async (company_id: string, status: 'Active' | 'Restricted') => {
    try {
      const { error } = await supabase
        .from("company")
        .update({ companyRestrict: status })
        .eq("company_id", company_id);
      if (error) throw new Error(error.message);
      fetchCompanies();
    } catch (err) {
      console.error(`Error updating restriction to ${status}:`, err);
      setError(`Failed to update company status`);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C] p-8">
      {/* Header */}
      <div className="w-screen h-[80px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-b border-black flex items-center justify-between px-6 z-10">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
        <div className="flex items-center">
          <button
            onClick={() => setProfileOpen(!isProfileOpen)}
            className="relative p-3 hover:bg-blue-800 rounded-full transition-all duration-300"
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-6 top-[4.5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem] animate-slide-in-down">
              <div className="bg-blue-800 text-white p-4 text-center">
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden mb-3 border-4 border-blue-300">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 mx-auto text-white" />
                  )}
                </div>
                <p className="font-semibold text-xl">{userName}</p>
                <p className="text-sm text-blue-200 capitalize">{userRole}</p>
              </div>
              <ul className="text-sm">
                <li>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                  >
                    <User className="w-6 h-6 mr-3" /> Profile
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                    <Settings className="w-6 h-6 mr-3" /> Settings
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                    <CircleHelp className="w-6 h-6 mr-3" /> Help & Support
                  </button>
                </li>
                {userRole === "admin" && (
                  <li>
                    <button
                    onClick={() => navigate("/admin")}
                    className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                  >
                    <UserCog className="w-6 h-6 mr-3" /> Admin
                  </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-6 py-4 hover:bg-red-50 text-red-600 flex items-center transition-all duration-200"
                  >
                    <LogOut className="w-6 h-6 mr-3" /> Log out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black">
        <h2 className="text-center justify-center py-4 font-bold text-5xl mb-6">Company Management</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <div className="flex justify-center items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-64 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleNewCompany}
            className="bg-[#90D5FF] hover:bg-blue-300 text-black font-bold py-2 px-6 rounded transition-colors"
          >
            New Company
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-3 border border-gray-300">Logo</th>
                <th className="p-3 border border-gray-300">Name</th>
                <th className="p-3 border border-gray-300">Email</th>
                <th className="p-3 border border-gray-300">Contact</th>
                <th className="p-3 border border-gray-300">Address</th>
                <th className="p-3 border border-gray-300">Status</th>
                <th className="p-3 border border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company, index) => (
                <tr
                  key={company.company_id}
                  className={`text-center ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <td className="p-3 border border-gray-300">
                    {company.logo_url && (
                      <img src={company.logo_url} alt="Logo" className="h-10 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 border border-gray-300">{company.name}</td>
                  <td className="p-3 border border-gray-300">{company.email}</td>
                  <td className="p-3 border border-gray-300">{company.contact_no}</td>
                  <td className="p-3 border border-gray-300">{company.address}</td>
                  <td className="p-3 border border-gray-300">{company.companyRestrict}</td>
                  <td className="p-3 border border-gray-300 space-x-2">
                    <button
                      onClick={() => handleEdit(company)}
                      className="bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRestrictCompany(company.company_id, company.companyRestrict === 'Active' ? 'Restricted' : 'Active')}
                      className={`px-3 py-1 rounded text-white ${company.companyRestrict === 'Active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      {company.companyRestrict === 'Active' ? 'Restrict' : 'Unrestrict'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="font-bold text-lg mb-4">{editingCompanyId ? "Edit Company" : "Add Company"}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={newCompany.name || ""}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="border p-2 w-full rounded"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newCompany.address || ""}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  className="border p-2 w-full rounded"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newCompany.email || ""}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  className="border p-2 w-full rounded"
                />
                <input
                  type="text"
                  placeholder="Contact No"
                  value={newCompany.contact_no || ""}
                  onChange={(e) => setNewCompany({ ...newCompany, contact_no: e.target.value })}
                  className="border p-2 w-full rounded"
                />
                <input
                  type="time"
                  placeholder="Opening Time"
                  value={newCompany.start_time || ""}
                  onChange={(e) => setNewCompany({ ...newCompany, start_time: e.target.value })}
                  className="border p-2 w-full rounded"
                />
                <input
                  type="time"
                  placeholder="Closing Time"
                  value={newCompany.end_time || ""}
                  onChange={(e) => setNewCompany({ ...newCompany, end_time: e.target.value })}
                  className="border p-2 w-full rounded"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="border p-2 w-full"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdateCompany}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingCompanyId ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyManagement;