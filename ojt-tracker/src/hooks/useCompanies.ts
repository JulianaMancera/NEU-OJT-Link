import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import Company from "../types/Company";

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompaniesAndJobs = async () => {
      try {
        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase
          .from("company")
          .select("*");

        if (companiesError) {
          console.error("Error fetching companies:", companiesError);
          setError(`Error fetching companies: ${companiesError.message}`);
          return;
        }

        // Fetch jobs for each company
        const companiesWithJobs = await Promise.all(
          companiesData.map(async (company) => {
            try {
              const { data: jobsData, error: jobsError } = await supabase
                .from("job")
                .select("*")
                .eq("company_id", company.company_id);

              if (jobsError) {
                console.error(`Error fetching jobs for company ${company.company_id}:`, jobsError);
                return { ...company, jobs: [] };
              }

              return { ...company, jobs: jobsData || [] };
            } catch (error) {
              console.error(`Error processing company ${company.company_id}:`, error);
              return { ...company, jobs: [] };
            }
          })
        );

        setCompanies(companiesWithJobs);
      } catch (error) {
        console.error('Error in fetchCompaniesAndJobs:', error);
        setError('An unexpected error occurred while fetching data');
      }
    };

    fetchCompaniesAndJobs();
  }, []);

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    companies: filteredCompanies,
    searchQuery,
    setSearchQuery,
    selectedCompany,
    setSelectedCompany,
    showCompanyModal,
    setShowCompanyModal,
    error
  };
}; 