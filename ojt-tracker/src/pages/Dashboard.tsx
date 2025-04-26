import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import CompanyApplication from "../components/CompanyApplication";
import ApplicationStatusModal from "../components/ApplicationStatusModal";
import OJTLogo from "/src/assets/ojt-logo-dashboard.svg";
import { ProfileMenu } from "../components/ProfileMenu";
import { Search, X } from "lucide-react";
import { Loading } from "../components/Loading";
import { useUserData } from "../hooks/useUserData";
import { useApplicationData } from "../hooks/useApplicationData";
import { useCompanies } from "../hooks/useCompanies";

const Dashboard = () => {
  const navigate = useNavigate();
  const { loading, userName, userRole, profilePicture } = useUserData();
  const {
    applicationId,
    applicationStatus,
    hasApprovedApplication,
    approvedCompany,
    approvedJob,
    showApprovalModal,
    setShowApprovalModal,
    updateApplicationStatus
  } = useApplicationData();
  const {
    companies,
    searchQuery,
    setSearchQuery,
    selectedCompany,
    setSelectedCompany
  } = useCompanies();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleModalClose = () => {
    setShowApprovalModal(false);
    if (applicationStatus === 'availability_submitted' && approvedCompany) {
      setSelectedCompany(approvedCompany);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
        <img src={OJTLogo} alt="Ojt Logo" className="w-[220px] h-[220px] ml-4" />
        <div className="flex space-x-4">
          <ProfileMenu
            userName={userName}
            userRole={userRole}
            profilePicture={profilePicture}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {approvedCompany && (
        <ApplicationStatusModal
          isOpen={showApprovalModal}
          onClose={handleModalClose}
          status={applicationStatus}
          companyName={approvedCompany.name}
          companyId={approvedCompany.company_id}
          applicationId={applicationId || ""}
          job={approvedJob || {
            job_id: '',
            position: 'Selected Position',
            company_id: approvedCompany.company_id
          }}
          onUpdateStatus={updateApplicationStatus}
        />
      )}

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
          {companies.map((company) => (
            <div key={company.company_id} className="w-full">
              <div
                onClick={() => setSelectedCompany(selectedCompany === company ? null : company)}
                className="h-full min-h-[220px] border rounded-2xl shadow-[0_0_15px_4px_rgba(169,162,255,0.5)] p-8 bg-white cursor-pointer flex flex-col justify-between transform transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_6px_rgba(169,162,255,0.7)] z-10"
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
                      hasApprovedApplication={hasApprovedApplication && approvedCompany?.company_id === company.company_id}
                      applicationId={applicationId}
                      initialStep="selectJob"
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