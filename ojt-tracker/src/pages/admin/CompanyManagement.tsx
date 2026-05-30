import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import AdminLayout from "./AdminLayout";
import { Building, MapPin, Mail, Phone, Upload, Clock, User } from "lucide-react";

interface Company {
  company_id: string;
  name: string;
  address: string;
  email: string;
  contact_no: string;
  logo_url: string;
  start_time: string;
  end_time: string;
  companyRestrict: "Active" | "Restricted";
  supervisor: string;
}

interface CompanyForm extends Partial<Company> {
  start_hour?: string;
  start_minute?: string;
  start_period?: "AM" | "PM";
  end_hour?: string;
  end_minute?: string;
  end_period?: "AM" | "PM";
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newCompany, setNewCompany] = useState<CompanyForm>({
    name: "",
    address: "",
    email: "",
    contact_no: "",
    start_time: "06:00",
    end_time: "17:00",
    companyRestrict: "Active",
    supervisor: "",
    start_hour: "06",
    start_minute: "00",
    start_period: "AM",
    end_hour: "05",
    end_minute: "00",
    end_period: "PM",
  });
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Restricted">("All");

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const filtered = companies.filter(
      (company) =>
        (filterStatus === "All" || company.companyRestrict === filterStatus) &&
        (searchQuery.trim() === "" ||
          company.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
    if (!String(newCompany.contact_no ?? "").trim())
      errors.contact_no = "Contact number is required";
    if (!newCompany.supervisor?.trim()) errors.supervisor = "Supervisor name is required";

    const startHour = parseInt(newCompany.start_hour || "06");
    const startMinute = parseInt(newCompany.start_minute || "00");
    const startPeriod = newCompany.start_period || "AM";
    const endHour = parseInt(newCompany.end_hour || "05");
    const endMinute = parseInt(newCompany.end_minute || "00");
    const endPeriod = newCompany.end_period || "PM";

    let startTime24 = startHour % 12;
    if (startPeriod === "PM" && startHour !== 12) startTime24 += 12;
    if (startPeriod === "AM" && startHour === 12) startTime24 = 0;

    let endTime24 = endHour % 12;
    if (endPeriod === "PM" && endHour !== 12) endTime24 += 12;
    if (endPeriod === "AM" && endHour === 12) endTime24 = 0;

    if (startTime24 < 6 || startTime24 > 17) errors.time = "Start time must be between 6 AM and 5 PM";
    if (endTime24 < 6 || endTime24 > 17) errors.time = "End time must be between 6 AM and 5 PM";

    const startMins = startTime24 * 60 + startMinute;
    const endMins = endTime24 * 60 + endMinute;
    if (startMins >= endMins) errors.time = "End time must be after start time";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCompany((prev) => {
      const updated = { ...prev, [name]: value };
      if (["start_hour", "start_minute", "start_period"].includes(name)) {
        const h = parseInt(updated.start_hour || "06");
        const m = updated.start_minute || "00";
        const p = updated.start_period || "AM";
        updated.start_time = `${((h % 12) + (p === "PM" && h !== 12 ? 12 : 0) || (p === "AM" && h === 12 ? 0 : h)).toString().padStart(2, "0")}:${m}`;
      }
      if (["end_hour", "end_minute", "end_period"].includes(name)) {
        const h = parseInt(updated.end_hour || "05");
        const m = updated.end_minute || "00";
        const p = updated.end_period || "PM";
        updated.end_time = `${((h % 12) + (p === "PM" && h !== 12 ? 12 : 0) || (p === "AM" && h === 12 ? 0 : h)).toString().padStart(2, "0")}:${m}`;
      }
      return updated;
    });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddOrUpdateCompany = async () => {
    if (!validateForm()) return;
    try {
      const logo_url = await handleFileUpload();
      const startHour = parseInt(newCompany.start_hour || "06");
      const startMinute = newCompany.start_minute || "00";
      const startPeriod = newCompany.start_period || "AM";
      const endHour = parseInt(newCompany.end_hour || "05");
      const endMinute = newCompany.end_minute || "00";
      const endPeriod = newCompany.end_period || "PM";

      const startTime24 = `${((startHour % 12) + (startPeriod === "PM" && startHour !== 12 ? 12 : 0) || (startPeriod === "AM" && startHour === 12 ? 0 : startHour)).toString().padStart(2, "0")}:${startMinute}`;
      const endTime24 = `${((endHour % 12) + (endPeriod === "PM" && endHour !== 12 ? 12 : 0) || (endPeriod === "AM" && endHour === 12 ? 0 : endHour)).toString().padStart(2, "0")}:${endMinute}`;

      if (editingCompanyId) {
        const companyData: Company = {
          company_id: editingCompanyId,
          name: newCompany.name || "",
          address: newCompany.address || "",
          email: newCompany.email || "",
          contact_no: newCompany.contact_no || "",
          logo_url,
          start_time: startTime24,
          end_time: endTime24,
          companyRestrict: newCompany.companyRestrict || "Active",
          supervisor: newCompany.supervisor || "",
        };
        const { data, error } = await supabase
          .from("company")
          .update(companyData)
          .eq("company_id", editingCompanyId)
          .select()
          .single();
        if (error) throw new Error(error.message);
        if (!data) throw new Error("No data returned from update");
        setCompanies((prev) => prev.map((c) => (c.company_id === editingCompanyId ? data : c)));
        setFilteredCompanies((prev) => prev.map((c) => (c.company_id === editingCompanyId ? data : c)));
        setMessage("✅ Company updated successfully!");
      } else {
        const companyData = {
          name: newCompany.name || "",
          address: newCompany.address || "",
          email: newCompany.email || "",
          contact_no: newCompany.contact_no || "",
          logo_url,
          start_time: startTime24,
          end_time: endTime24,
          companyRestrict: newCompany.companyRestrict || "Active",
          supervisor: newCompany.supervisor || "",
        };
        const { data: inserted, error } = await supabase
          .from("company")
          .insert([companyData])
          .select()
          .single();
        if (error || !inserted) throw new Error(error?.message || "Insert failed");
        setCompanies((prev) => [...prev, inserted]);
        setFilteredCompanies((prev) => [...prev, inserted]);
        setMessage("✅ Company added successfully!");
      }
      setError("");
      setTimeout(() => setMessage(""), 3000);
      resetModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Company operation error:", msg);
      setMessage("");
      setError(`Failed to ${editingCompanyId ? "update" : "add"} company: ${msg}`);
    }
  };

  const resetModal = () => {
    setNewCompany({
      name: "",
      address: "",
      email: "",
      contact_no: "",
      start_time: "06:00",
      end_time: "17:00",
      companyRestrict: "Active",
      supervisor: "",
      start_hour: "06",
      start_minute: "00",
      start_period: "AM",
      end_hour: "05",
      end_minute: "00",
      end_period: "PM",
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
      const [startHour24, startMinute] = company.start_time.split(":").map(Number);
      const startPeriod = startHour24 < 12 || startHour24 === 0 ? "AM" : "PM";
      const startHour12 = ((startHour24 % 12) || 12).toString().padStart(2, "0");
      const [endHour24, endMinute] = company.end_time.split(":").map(Number);
      const endPeriod = endHour24 < 12 || endHour24 === 0 ? "AM" : "PM";
      const endHour12 = ((endHour24 % 12) || 12).toString().padStart(2, "0");
      setNewCompany({
        ...company,
        start_hour: startHour12,
        start_minute: startMinute.toString().padStart(2, "0"),
        start_period: startPeriod,
        end_hour: endHour12,
        end_minute: endMinute.toString().padStart(2, "0"),
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

  const handleRestrictCompany = async (company_id: string, status: "Active" | "Restricted") => {
    try {
      const { error } = await supabase
        .from("company")
        .update({ companyRestrict: status })
        .eq("company_id", company_id);
      if (error) throw new Error(error.message);
      setCompanies((prev) =>
        prev.map((c) => (c.company_id === company_id ? { ...c, companyRestrict: status } : c))
      );
      setFilteredCompanies((prev) =>
        prev.map((c) => (c.company_id === company_id ? { ...c, companyRestrict: status } : c))
      );
    } catch (err) {
      console.error(`Error updating restriction to ${status}:`, err);
      setError("Failed to update company status");
    }
  };

  const formatTo12Hour = (time24: string) => {
    try {
      const [hours, minutes] = time24.split(":");
      const date = new Date(0, 0, 0, parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return "-";
    }
  };

  const timeSelects = (prefix: "start" | "end") => (
    <div className="flex space-x-2">
      <select
        name={`${prefix}_hour`}
        value={(newCompany as Record<string, string>)[`${prefix}_hour`] || (prefix === "start" ? "06" : "05")}
        onChange={handleInputChange}
        className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const h = (i + 1).toString().padStart(2, "0");
          return <option key={h} value={h}>{h}</option>;
        })}
      </select>
      <select
        name={`${prefix}_minute`}
        value={(newCompany as Record<string, string>)[`${prefix}_minute`] || "00"}
        onChange={handleInputChange}
        className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {["00", "15", "30", "45"].map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        name={`${prefix}_period`}
        value={(newCompany as Record<string, string>)[`${prefix}_period`] || (prefix === "start" ? "AM" : "PM")}
        onChange={handleInputChange}
        className="border p-2 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );

  return (
    <AdminLayout>
      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black">
        <h2 className="text-center py-4 font-bold text-5xl mb-6">Company Management</h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{message}</div>}

        <div className="flex justify-center items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-64 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "All" | "Active" | "Restricted")}
            className="border p-2 w-40 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Restricted">Restricted</option>
          </select>
          <button
            onClick={() => { resetModal(); setIsModalOpen(true); }}
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
                  className={`text-center ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
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
                  <td className="p-3 border border-gray-300">
                    {company.start_time ? formatTo12Hour(company.start_time) : "-"}
                  </td>
                  <td className="p-3 border border-gray-300">
                    {company.end_time ? formatTo12Hour(company.end_time) : "-"}
                  </td>
                  <td className="p-3 border border-gray-300">{company.companyRestrict}</td>
                  <td className="p-3 border border-gray-300 space-x-2">
                    <button
                      onClick={() => handleEdit(company)}
                      className="bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleRestrictCompany(
                          company.company_id,
                          company.companyRestrict === "Active" ? "Restricted" : "Active"
                        )
                      }
                      className={`px-3 py-1 rounded text-white ${
                        company.companyRestrict === "Active"
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {company.companyRestrict === "Active" ? "Restrict" : "Unrestrict"}
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
                        onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      className="h-24 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
                      onClick={() => document.getElementById("logo-upload")?.click()}
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
                  {[
                    { name: "name", placeholder: "Company Name", icon: <Building className="absolute left-3 top-2.5 text-gray-400" size={18} /> },
                    { name: "address", placeholder: "Address", icon: <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} /> },
                    { name: "email", placeholder: "Email", type: "email", icon: <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} /> },
                    { name: "contact_no", placeholder: "Contact Number", icon: <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} /> },
                    { name: "supervisor", placeholder: "Supervisor", icon: <User className="absolute left-3 top-2.5 text-gray-400" size={18} /> },
                  ].map(({ name, placeholder, type, icon }) => (
                    <div key={name}>
                      <div className="relative">
                        <input
                          type={type || "text"}
                          name={name}
                          value={(newCompany as Record<string, string>)[name] || ""}
                          onChange={handleInputChange}
                          placeholder={placeholder}
                          className={`pl-10 pr-3 py-2 w-full border ${formErrors[name] ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-all`}
                        />
                        {icon}
                      </div>
                      {formErrors[name] && (
                        <p className="mt-1 text-sm text-red-500">{formErrors[name]}</p>
                      )}
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    {(["start", "end"] as const).map((prefix) => (
                      <div key={prefix}>
                        <label className="text-sm text-gray-600 mb-1 flex items-center">
                          <Clock className="mr-1" size={16} />
                          {prefix === "start" ? "Start" : "End"} Time
                        </label>
                        {timeSelects(prefix)}
                        {prefix === "start" && formErrors.time && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.time}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdateCompany}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
                >
                  {editingCompanyId ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CompanyManagement;
