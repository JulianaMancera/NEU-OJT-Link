import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  description: string;
  contact_email: string;
  website?: string;
  logo_url?: string;
}


const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from("CompanyList").select("*");
  
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
          <div key={company.id} className="border rounded-lg shadow-md p-6 bg-white">
            {company.logo_url && (
              <img src={company.logo_url} alt={company.name} className="w-16 h-16 mb-4" />
            )}
            <h2 className="text-xl text-gray-600 font-semibold">{company.name}</h2>
            <p className="text-gray-600">{company.industry} - {company.location}</p>
            <p className="text-gray-700 mt-2">{company.description}</p>
            <div className="mt-4">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-4">Website</a>
              )}
              <a href={`mailto:${company.contact_email}`} className="text-blue-600 hover:underline">Contact</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyList;
