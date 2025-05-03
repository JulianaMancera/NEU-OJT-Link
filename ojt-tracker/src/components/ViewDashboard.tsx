import { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import OJTLogo from "/src/assets/ojt-white.png";
import { ProfileMenu } from "../pages/profile/ProfileMenu";
import { Search, X } from "lucide-react";
import { Loading } from "../components/Loading";
import { useUserData } from "../hooks/useUserData";
import { useCompanies } from "../hooks/useCompanies";
import CompanyApplicationApply from "../components/CompanyApplicationApply";
import { Job } from "../types/Job";
import { Company } from "../types/Company";

const ViewDashboard = () => {
  const navigate = useNavigate();
  const { loading, userName, userRole, profilePicture } = useUserData();
  const { companies, searchQuery, setSearchQuery, selectedCompany, setSelectedCompany } = useCompanies();
  const [step, setStep] = useState<"selectJob" | "apply" | "requirement" | "dashboard">("selectJob");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setStep("apply");
  };

  const handleCloseModal = () => {
    setSelectedCompany(null);
    setSelectedJob(null);
    setStep("selectJob");
  };

  const handleHomeClick = () => {
    if (userRole === "admin" || userRole === "dean") {
      navigate("/admin");
    } else {
      navigate("/student-dashboard");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <img src={OJTLogo} alt="OJT Logo" className="w-[220px] h-[220px] ml-4" />
          <button
            onClick={handleHomeClick}
            className="text-white px-5 py-2 rounded-full transition-all duration-300 shadow-md hover:shadow-lg bg-transparent hover:bg-blue-700"
          >
            HOME
          </button>
        </div>
        <div className="flex space-x-4">
          <ProfileMenu
            userName={userName}
            userRole={userRole}
            profilePicture={profilePicture}
            onLogout={handleLogout}
          />
        </div>
      </div>

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
          {companies.map((company: Company) => (
            <div key={company.company_id} className="w-full">
              <div
                onClick={() => setSelectedCompany(selectedCompany === company ? null : company)}
                className="h-full bg-white rounded-lg shadow-[0_0_15px_4px_rgba(169,162,255,0.5)] p-8 cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_6px_rgba(169,162,255,0.7)] z-10"
              >
                <div className="mb-6">
                  <div className="w-30 h-18 flex items-center justify-left overflow-hidden">
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
                </div>

                <h2 className="text-xl font-medium text-gray-700 mb-4">{company.name}</h2>
                <p className="text-sm text-gray-600 mb-1">{company.address}</p>
                <p className="text-sm text-gray-600 mb-6">{company.email}</p>
                <p className="text-sm text-gray-700">{company.contact_no}</p>
              </div>

              {selectedCompany === company && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  <div
                    onClick={handleCloseModal}
                    className="fixed inset-0 backdrop-blur-sm bg-black/50 z-40"
                  />
                  <div className="bg-[#FDFBF6] p-6 rounded-lg shadow-lg w-full max-w-[100vh] h-[60vh] overflow-y-auto overflow-x-hidden relative z-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">{company.name}</h3>
                      <button onClick={handleCloseModal} className="bg-black p-2 rounded">
                        <X size={15} color="white" />
                      </button>
                    </div>

                    {step === "selectJob" && (
                      <div className="text-black max-w-md mx-auto px-4">
                        <div className="py-6">
                          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Possible Jobs</h3>
                          {company.jobs && company.jobs.length > 0 ? (
                            <div className="space-y-4">
                              {company.jobs.map((job: Job, index: number) => (
                                <div
                                  key={index}
                                  onClick={() => handleJobSelect(job)}
                                  className="w-120 -ml-5 mt-8 p-5 border-l-4 border-blue-500 rounded-lg shadow-md hover:shadow-lg cursor-pointer bg-white transition-all duration-300 transform hover:-translate-y-2"
                                >
                                  <h5 className="text-lg font-medium text-gray-800">{job.position}</h5>
                                  <div className="flex items-center mt-2 text-sm text-gray-500">
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span>View Details</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-lg">
                              <p className="mt-4 text-lg font-medium text-gray-500">
                                No Jobs Available in this company
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {step === "apply" && selectedJob && (
                      <CompanyApplicationApply
                        job={selectedJob}
                        company={company}
                        setStep={setStep}
                        setSelectedJob={setSelectedJob}
                        hasApplied={true}
                        hideApply={true} // Hide the apply button in ViewDashboard
                      />
                    )}
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

export default ViewDashboard;