import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

interface Company {
  company_id: string;
  name: string;
  address: string;
  email?: string;
  contact_no: string;
}


const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from("company").select("*");
  
      if (error) {
        console.error("Error fetching companies:", error.message);
      } else {
        console.log("Fetched companies:", data);
        setCompanies(data);
      }
      setLoading(false);
    };
  
    fetchCompanies();
  }, []);
  

  if (loading) {
    return <div className="text-center mt-10">Loading companies...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Affiliated Companies</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.company_id} className="border rounded-lg shadow-md p-6 bg-white">
            <h2 className="text-xl text-gray-600 font-semibold">{company.name}</h2>
            <p className="text-gray-600">{company.address} - {company.email}</p>
            <p className="text-gray-700 mt-2">{company.contact_no}</p>
            
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyList;
