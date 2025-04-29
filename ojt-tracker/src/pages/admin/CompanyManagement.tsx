import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { Job } from '../../types/Job';

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
  jobs: Job[];
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({});
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from("company").select("*");
    if (error) console.error("Error fetching companies:", error);
    else setCompanies(data);
  };

  const handleFileUpload = async () => {
    if (!logoFile) return "";

    const fileName = logoFile.name;
    const { error } = await supabase.storage
      .from("logos")
      .upload(fileName, logoFile, {
        contentType: logoFile.type,
        upsert: true,
      });

    if (error) {
      console.error("File upload error:", error.message);
      return "";
    }

    const publicUrl = supabase.storage.from("logos").getPublicUrl(fileName).data.publicUrl;
    return publicUrl;
  };

  const handleAddOrUpdateCompany = async () => {
    const logo_url = logoFile ? await handleFileUpload() : newCompany.logo_url;

    const companyData = {
      ...newCompany,
      logo_url,
    };

    if (editingCompanyId) {
      const { error } = await supabase
        .from("company")
        .update(companyData)
        .eq("company_id", editingCompanyId);
      if (error) return console.error("Update error:", error.message);
    } else {
      const { error } = await supabase.from("company").insert([companyData]);
      if (error) return console.error("Insert error:", error.message);
    }

    setNewCompany({});
    setLogoFile(null);
    setEditingCompanyId(null);
    setIsModalOpen(false);
    fetchCompanies();
  };

  const handleEdit = (company: Company) => {
    setNewCompany(company);
    setEditingCompanyId(company.company_id);
    setIsModalOpen(true);
  };

  const handleNewCompany = () => {
    setNewCompany({});
    setEditingCompanyId(null);
    setIsModalOpen(true);
  };

  const handleRestrictCompany = async (company_id: string, status: 'Active' | 'Restricted') => {
    const { error } = await supabase
      .from("company")
      .update({ companyRestrict: status })
      .eq("company_id", company_id);
  
    if (error) {
      console.error(`Error updating restriction to ${status}:`, error.message);
    } else {
      fetchCompanies(); // Refresh the list
    }
  };
  
  

  return (
    <div className="p-5 w-screen h-full bg-[linear-gradient(to_bottom,#0A279C_20%,#5F74C9_86%)]">
      <h2 className="text-center font-bold text-2xl mb-4 mt-5">Company Management</h2>

    {/* New Company Button */}
    <div className="flex justify-center mb-4">
        <button
          onClick={handleNewCompany}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          New Company
        </button>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-950">
          <tr>
            <th className="p-2 border">Logo</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Contact</th>
            <th className="p-2 border">Address</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.company_id} className="text-center">
              <td className="p-2 border">
                <img src={company.logo_url} alt="Logo" className="h-10 mx-auto" />
              </td>
              <td className="p-2 border">{company.name}</td>
              <td className="p-2 border">{company.email}</td>
              <td className="p-2 border">{company.contact_no}</td>
              <td className="p-2 border">{company.address}</td>
              <td className="p-2 border">{company.companyRestrict}</td>
              <td className="p-2 border">
                <button
                  onClick={() => handleEdit(company)}
                  className="bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              
                {company.companyRestrict !== 'Restricted' && (
                <button
                  onClick={() => handleRestrictCompany(company.company_id, 'Restricted')}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Restrict
                </button>
              )}  
              {company.companyRestrict === 'Restricted' && (
                <button
                  onClick={() => handleRestrictCompany(company.company_id, 'Active')}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Unrestrict
                </button>
              )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-blue bg-opacity-50 flex items-center justify-center">
          <div className="bg-gradient-to-b from-[#578FCA] to-[#2B4764] p-6 rounded-md w-[500px]">
            <h3 className="font-bold text-lg mb-4">{editingCompanyId ? "Edit Company" : "Add Company"}</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Company Name"
                value={newCompany.name || ""}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="border p-2"
              />
              <input
                type="text"
                placeholder="Address"
                value={newCompany.address || ""}
                onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                className="border p-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={newCompany.email || ""}
                onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                className="border p-2"
              />
              <input
                type="text"
                placeholder="Contact No"
                value={newCompany.contact_no || ""}
                onChange={(e) => setNewCompany({ ...newCompany, contact_no: e.target.value })}
                className="border p-2"
              />
              <input
                type="time"
                placeholder="Opening Time"
                value={newCompany.start_time || ""}
                onChange={(e) => setNewCompany({ ...newCompany, start_time: e.target.value })}
                className="border p-2"
              />
              <input
                type="time"
                placeholder="Closing Time"
                value={newCompany.end_time || ""}
                onChange={(e) => setNewCompany({ ...newCompany, end_time: e.target.value })}
                className="border p-2"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="border p-2"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdateCompany}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingCompanyId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
