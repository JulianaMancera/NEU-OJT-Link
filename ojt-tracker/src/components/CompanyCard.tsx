import { Company } from "../types/Company";

interface CompanyCardProps {
  company: Company;
  onClick: () => void;
}

export const CompanyCard = ({ company, onClick }: CompanyCardProps) => (
  <div className="w-full">
    <div
      onClick={onClick}
      className="h-full min-h-[220px] border rounded-2xl shadow-[0_0_15px_4px_rgba(169,162,255,0.5)] p-8 bg-white cursor-pointer flex flex-col justify-between transform transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_6px_rgba(169,162,255,0.7)] z-10"
    >
      <div className="w-30 h-30 rounded border flex items-center justify-center overflow-hidden flex-shrink-0 mr-4">
        {company.logo_url ? (
          <img src={company.logo_url} alt={`${company.name} logo`} className="max-w-full max-h-full object-contain" />
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
  </div>
); 