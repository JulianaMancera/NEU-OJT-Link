import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";

interface Company {
  company_id: string;
  name: string;
  address: string;
  email: string;
  contact_no: string;
  logo_url: string;
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({});
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

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
  
    const fileName = logoFile.name; // use the original name
    const { error } = await supabase.storage
      .from("logos")
      .upload(fileName, logoFile, {
        contentType: logoFile.type,
        upsert: true, // optional: overwrite if same file name exists
      });
  
    if (error) {
      console.error("File upload error:", error.message); //CompanyManagement.tsx:41
      return "";
    }
  
    const publicUrl = supabase.storage.from("logos").getPublicUrl(fileName).data.publicUrl;
    return publicUrl;
  };
  

  const handleAddOrUpdateCompany = async () => {
    const logo_url = logoFile ? await handleFileUpload() : newCompany.logo_url; //@	CompanyManagement.tsx:51

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
    fetchCompanies();
  };

  const handleEdit = (company: Company) => {
    setNewCompany(company);
    setEditingCompanyId(company.company_id);
  };

  return (
    <div className="p-6">
      <h2 className="text-center font-bold text-2xl mb-4">Company Management</h2>

      <div className="mb-8">
        <h3 className="font-semibold mb-2">{editingCompanyId ? "Edit Company" : "Add Company"}</h3>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Company Name"
            value={newCompany.name || ""}
            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
            className="border p-2 w-60"
          />
          <input
            type="text"
            placeholder="Address"
            value={newCompany.address || ""}
            onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
            className="border p-2 w-60"
          />
          <input
            type="email"
            placeholder="Email"
            value={newCompany.email || ""}
            onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
            className="border p-2 w-60"
          />
          <input
            type="text"
            placeholder="Contact No"
            value={newCompany.contact_no || ""}
            onChange={(e) => setNewCompany({ ...newCompany, contact_no: e.target.value })}
            className="border p-2 w-60"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="border p-2 w-60"
          />
          <button
            onClick={handleAddOrUpdateCompany}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {editingCompanyId ? "Update Company" : "Add Company"}
          </button>
        </div>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-950">
          <tr>
            <th className="p-2 border">Logo</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Contact</th>
            <th className="p-2 border">Address</th>
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
              <td className="p-2 border">
                <button
                  onClick={() => handleEdit(company)}
                  className="bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyManagement;
