import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { User, Settings, CircleHelp, LogOut, UserCog, Building, MapPin, Mail, Phone, Upload, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Company {
  company_id: string;
  name: string;
  address: string;
  email: string;
  contact_no: string;
  logo_url: string;
  start_time: string;
  end_time: string;
  companyRestrict: 'Active' | 'Restricted';
  supervisor: string;
}

interface CompanyForm extends Partial<Company> {
  start_hour?: string;
  start_minute?: string;
  start_period?: 'AM' | 'PM';
  end_hour?: string;
  end_minute?: string;
  end_period?: 'AM' | 'PM';
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newCompany, setNewCompany] = useState<CompanyForm>({
    name: '',
    address: '',
    email: '',
    contact_no: '',
    start_time: '06:00',
    end_time: '17:00',
    companyRestrict: 'Active',
    supervisor: '',
    start_hour: '06',
    start_minute: '00',
    start_period: 'AM',
    end_hour: '05',
    end_minute: '00',
    end_period: 'PM',
  });
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Restricted'>('All');
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string>("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

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
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out");
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const filtered = companies.filter((company) =>
      (filterStatus === 'All' || company.companyRestrict === filterStatus) &&
      (searchQuery.trim() === "" || company.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredCompanies(filtered);
  }, [searchQuery, companies, filterStatus]);

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
        .upload(fileName, logoFile, { contentType: logoFile.type, upsert: true });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload logo");
      return "";
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!newCompany.name?.trim()) errors.name = "Company name is required";
    if (!newCompany.address?.trim()) errors.address = "Address is required";
    if (!newCompany.email?.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newCompany.email)) errors.email = "Email is invalid";
    // Ito error dahil hindi number yung string. Trim function ay only for string, not for number.
    if (!String(newCompany.contact_no ?? "").trim()) { 
     errors.contact_no = "Contact number is required";
    }; 
    if (!newCompany.supervisor?.trim()) errors.supervisor = "Supervisor name is required";

    const startHour = parseInt(newCompany.start_hour || '06');
    const startMinute = parseInt(newCompany.start_minute || '00');
    const startPeriod = newCompany.start_period || 'AM';
    const endHour = parseInt(newCompany.end_hour || '05');
    const endMinute = parseInt(newCompany.end_minute || '00');
    const endPeriod = newCompany.end_period || 'PM';

    let startTime24 = startHour % 12;
    if (startPeriod === 'PM' && startHour !== 12) startTime24 += 12;
    if (startPeriod === 'AM' && startHour === 12) startTime24 = 0;

    let endTime24 = endHour % 12;
    if (endPeriod === 'PM' && endHour !== 12) endTime24 += 12;
    if (endPeriod === 'AM' && endHour === 12) endTime24 = 0;

    if (startTime24 < 6 || startTime24 > 17) {
      errors.time = "Start time must be between 6 AM and 5 PM";
    }
    if (endTime24 < 6 || endTime24 > 17) {
      errors.time = "End time must be between 6 AM and 5 PM";
    }

    const startMinutes = startTime24 * 60 + startMinute;
    const endMinutes = endTime24 * 60 + endMinute;
    if (startMinutes >= endMinutes) {
      errors.time = "End time must be after start time";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCompany((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'start_hour' || name === 'start_minute' || name === 'start_period') {
        const hour = parseInt(updated.start_hour || '06');
        const minute = updated.start_minute || '00';
        const period = updated.start_period || 'AM';
        updated.start_time = `${((hour % 12) + (period === 'PM' && hour !== 12 ? 12 : 0) || (period === 'AM' && hour === 12 ? 0 : hour)).toString().padStart(2, '0')}:${minute}`;
      }
      if (name === 'end_hour' || name === 'end_minute' || name === 'end_period') {
        const hour = parseInt(updated.end_hour || '05');
        const minute = updated.end_minute || '00';
        const period = updated.end_period || 'PM';
        updated.end_time = `${((hour % 12) + (period === 'PM' && hour !== 12 ? 12 : 0) || (period === 'AM' && hour === 12 ? 0 : hour)).toString().padStart(2, '0')}:${minute}`;
      }
      return updated;
    });

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOrUpdateCompany = async () => {
    if (!validateForm()) return;

    try {
      const logo_url = await handleFileUpload();
      const startHour = parseInt(newCompany.start_hour || '06');
      const startMinute = newCompany.start_minute || '00';
      const startPeriod = newCompany.start_period || 'AM';
      const endHour = parseInt(newCompany.end_hour || '05');
      const endMinute = newCompany.end_minute || '00';
      const endPeriod = newCompany.end_period || 'PM';

      const startTime24 = `${((startHour % 12) + (startPeriod === 'PM' && startHour !== 12 ? 12 : 0) || (startPeriod === 'AM' && startHour === 12 ? 0 : startHour)).toString().padStart(2, '0')}:${startMinute}`;
      const endTime24 = `${((endHour % 12) + (endPeriod === 'PM' && endHour !== 12 ? 12 : 0) || (endPeriod === 'AM' && endHour === 12 ? 0 : endHour)).toString().padStart(2, '0')}:${endMinute}`;

      const companyData: Company = {
        company_id: editingCompanyId || '',
        name: newCompany.name || '',
        address: newCompany.address || '',
        email: newCompany.email || '',
        contact_no: newCompany.contact_no || '',
        logo_url,
        start_time: startTime24,
        end_time: endTime24,
        companyRestrict: newCompany.companyRestrict || 'Active',
        supervisor: newCompany.supervisor || ''
      };

      if (editingCompanyId) {
        const { data, error } = await supabase
          .from("company")
          .update({
            name: companyData.name,
            address: companyData.address,
            email: companyData.email,
            contact_no: companyData.contact_no,
            logo_url: companyData.logo_url,
            start_time: companyData.start_time,
            end_time: companyData.end_time,
            companyRestrict: companyData.companyRestrict,
            supervisor: companyData.supervisor
          })
          .eq("company_id", editingCompanyId)
          .select()
          .single();

        if (error) throw new Error(error.message);
        if (!data) throw new Error("No data returned from update");

        setCompanies((prev) =>
          prev.map((c) =>
            c.company_id === editingCompanyId ? { ...companyData, company_id: editingCompanyId } : c
          )
        );
        setFilteredCompanies((prev) =>
          prev.map((c) =>
            c.company_id === editingCompanyId ? { ...companyData, company_id: editingCompanyId } : c
          )
        );
      } else {
        const { data: inserted, error } = await supabase
          .from("company")
          .insert([companyData])
          .select()
          .single();

        if (error || !inserted) throw new Error(error?.message || "Insert failed");
        setCompanies((prev) => [...prev, inserted as Company]);
        setFilteredCompanies((prev) => [...prev, inserted as Company]);
      }
      resetModal();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Company operation error:", errorMessage);
      setError(`Failed to ${editingCompanyId ? 'update' : 'add'} company: ${errorMessage}`);
    }
  };

  const resetModal = () => {
    setNewCompany({
      name: '',
      address: '',
      email: '',
      contact_no: '',
      start_time: '06:00',
      end_time: '17:00',
      companyRestrict: 'Active',
      supervisor: '',
      start_hour: '06',
      start_minute: '00',
      start_period: 'AM',
      end_hour: '05',
      end_minute: '00',
      end_period: 'PM',
    });
    setLogoFile(null);
    setLogoPreview(null);
    setEditingCompanyId(null);
    setIsModalOpen(false);
    setFormErrors({});
    setError(null);
  };

  const handleEdit = (company: Company) => {
    try {
      const [startHour24, startMinute] = company.start_time.split(':').map(Number);
      const startPeriod = startHour24 < 12 || startHour24 === 0 ? 'AM' : 'PM';
      const startHour12 = ((startHour24 % 12) || 12).toString().padStart(2, '0');

      const [endHour24, endMinute] = company.end_time.split(':').map(Number);
      const endPeriod = endHour24 < 12 || endHour24 === 0 ? 'AM' : 'PM';
      const endHour12 = ((endHour24 % 12) || 12).toString().padStart(2, '0');

      setNewCompany({
        name: company.name,
        address: company.address,
        email: company.email,
        contact_no: company.contact_no,
        logo_url: company.logo_url,
        start_time: company.start_time,
        end_time: company.end_time,
        companyRestrict: company.companyRestrict,
        supervisor: company.supervisor,
        start_hour: startHour12,
        start_minute: startMinute.toString().padStart(2, '0'),
        start_period: startPeriod,
        end_hour: endHour12,
        end_minute: endMinute.toString().padStart(2, '0'),
        end_period: endPeriod,
      });
      setEditingCompanyId(company.company_id);
      setLogoPreview(company.logo_url || null);
      setLogoFile(null);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error in handleEdit:", err);
      setError("Failed to load company data for editing");
    }
  };

  const handleNewCompany = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const handleRestrictCompany = async (company_id: string, status: 'Active' | 'Restricted') => {
    try {
      const { error } = await supabase
        .from("company")
        .update({ companyRestrict: status })
        .eq("company_id", company_id);
      if (error) throw new Error(error.message);
      setCompanies((prev) => prev.map(c => c.company_id === company_id ? { ...c, companyRestrict: status } : c));
      setFilteredCompanies((prev) => prev.map(c => c.company_id === company_id ? { ...c, companyRestrict: status } : c));
    } catch (err) {
      console.error(`Error updating restriction to ${status}:`, err);
      setError(`Failed to update company status`);
    }
  };

  const formatTo12Hour = (time24: string) => {
    try {
      const [hours, minutes] = time24.split(':');
      const date = new Date(0, 0, 0, parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '-';
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#5F74C9] to-[#0A279C] p-8">
      <div className="w-screen h-[80px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-b border-black flex items-center justify-between px-6 z-10">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
        <div className="flex items-center">
          <button onClick={() => setProfileOpen(!isProfileOpen)} className="relative p-3 hover:bg-blue-800 rounded-full transition-all duration-300">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-blue-300" />
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
                  <button onClick={() => { navigate("/profile"); setProfileOpen(false); }} className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
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
                    <button onClick={() => navigate("/admin")} className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                      <UserCog className="w-6 h-6 mr-3" /> Admin
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={handleLogout} className="w-full text-left px-6 py-4 hover:bg-red-50 text-red-600 flex items-center transition-all duration-200">
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
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>
        )}

        <div className="flex justify-center items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border p-2 w-64 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Active' | 'Restricted')}
            className="border p-2 w-40 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Restricted">Restricted</option>
          </select>
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
                <th className="p-3 border border-gray-300">Supervisor</th>
                <th className="p-3 border border-gray-300">Start Time</th>
                <th className="p-3 border border-gray-300">End Time</th>
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
                  <td className="p-3 border border-gray-300">{company.supervisor}</td>
                  <td className="p-3 border border-gray-300">{company.start_time ? formatTo12Hour(company.start_time) : '-'}</td>
                  <td className="p-3 border border-gray-300">{company.end_time ? formatTo12Hour(company.end_time) : '-'}</td>
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

        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="bg-blue-600 p-4 text-white">
                <h2 className="text-xl font-bold flex items-center">
                  <Building className="mr-2" size={20} />
                  {editingCompanyId ? "Edit Company" : "Add Company"}
                </h2>
              </div>

              <div className="p-6">
                <div className="mb-8 text-center">
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-24 w-24 object-contain mx-auto rounded border border-gray-200"
                      />
                      <button
                        onClick={() => {setLogoPreview(null); setLogoFile(null);}}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      className="h-24 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-1 text-sm text-gray-500">Upload company logo</p>
                      </div>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={newCompany.name || ""}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        className={`pl-10 pr-3 py-2 w-full border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-all`}
                      />
                      <Building className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        name="address"
                        value={newCompany.address || ""}
                        onChange={handleInputChange}
                        placeholder="Address"
                        className={`pl-10 pr-3 py-2 w-full border ${formErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-all`}
                      />
                      <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    {formErrors.address && <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={newCompany.email || ""}
                        onChange={handleInputChange}
                        placeholder="Email"
                        className={`pl-10 pr-3 py-2 w-full border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-all`}
                      />
                      <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        name="contact_no"
                        value={newCompany.contact_no || ""}
                        onChange={handleInputChange}
                        placeholder="Contact Number"
                        className={`pl-10 pr-3 py-2 w-full border ${formErrors.contact_no ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-all`}
                      />
                      <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    {formErrors.contact_no && <p className="mt-1 text-sm text-red-500">{formErrors.contact_no}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        name="supervisor"
                        value={newCompany.supervisor || ""}
                        onChange={handleInputChange}
                        placeholder="Supervisor"
                        className={`pl-10 pr-3 py-2 w-full border ${formErrors.supervisor ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-all`}
                      />
                      <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    {formErrors.supervisor && <p className="mt-1 text-sm text-red-500">{formErrors.supervisor}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 flex items-center">
                        <Clock className="mr-1" size={16} />
                        Start Time
                      </label>
                      <div className="flex space-x-2">
                        <select
                          name="start_hour"
                          value={newCompany.start_hour || '06'}
                          onChange={handleInputChange}
                          className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = (i + 1).toString().padStart(2, '0');
                            return <option key={hour} value={hour}>{hour}</option>;
                          })}
                        </select>
                        <select
                          name="start_minute"
                          value={newCompany.start_minute || '00'}
                          onChange={handleInputChange}
                          className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {['00', '15', '30', '45'].map(minute => (
                            <option key={minute} value={minute}>{minute}</option>
                          ))}
                        </select>
                        <select
                          name="start_period"
                          value={newCompany.start_period || 'AM'}
                          onChange={handleInputChange}
                          className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      {formErrors.time && <p className="mt-1 text-sm text-red-500">{formErrors.time}</p>}
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 mb-1 flex items-center">
                        <Clock className="mr-1" size={16} />
                        End Time
                      </label>
                      <div className="flex space-x-2">
                        <select
                          name="end_hour"
                          value={newCompany.end_hour || '05'}
                          onChange={handleInputChange}
                          className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = (i + 1).toString().padStart(2, '0');
                            return <option key={hour} value={hour}>{hour}</option>;
                          })}
                        </select>
                        <select
                          name="end_minute"
                          value={newCompany.end_minute || '00'}
                          onChange={handleInputChange}
                          className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {['00', '15', '30', '45'].map(minute => (
                            <option key={minute} value={minute}>{minute}</option>
                          ))}
                        </select>
                        <select
                          name="end_period"
                          value={newCompany.end_period || 'PM'}
                          onChange={handleInputChange}
                          className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      {formErrors.time && <p className="mt-1 text-sm text-red-500">{formErrors.time}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdateCompany}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
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
