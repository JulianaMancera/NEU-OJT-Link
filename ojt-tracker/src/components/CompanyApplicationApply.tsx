import React from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { Job } from "../types/Job";
import { Company } from "../types/Company";

interface CompanyApplicationApplyProps {
  job: Job;
  company: Company;
  setStep: React.Dispatch<React.SetStateAction<"selectJob" | "apply" | "requirement" | "dashboard">>;
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
  hasApplied: boolean;
  hideApply?: boolean; // New optional prop to hide the apply button
}

const CompanyApplicationApply: React.FC<CompanyApplicationApplyProps> = ({
  job,
  company,
  setStep,
  setSelectedJob,
  hasApplied,
  hideApply = false, // Default to false
}) => {
  const handleBack = () => {
    setSelectedJob(null);
    setStep("selectJob");
  };

  const handleApply = () => {
    if (!hasApplied) {
      setStep("requirement");
    }
  };

  const formatTime = (time: string) => {
    const [hourStr, minStr] = time.split(":");
    const date = new Date();
    date.setHours(+hourStr, +minStr);
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="text-gray-800 max-w-6xl mx-auto p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">
          {job.position} at {company.name}
        </h1>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          aria-label="Back to job list"
        >
          <ArrowLeft size={20} />
          Back to Job List
        </button>
        {!hideApply && (
          <button
            onClick={handleApply}
            className={`px-6 py-2 rounded-lg transition-colors ${
              hasApplied
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            aria-label={`Apply for ${job.position}`}
            disabled={hasApplied}
          >
            {hasApplied ? "Application in Progress" : "Apply Now"} 
          </button>
        )}
      </div> 
        {/* Company schedule display */}
        <div className="text-center mb-10">
          <h3 className="text-lg font-semibold mb-4 text-left flex items-center">
          <Clock className="w-5 h-5 mr-3 text-black" />
           Day and Schedule</h3>
          <div className="bg-white shadow-md rounded-lg p-4 max-w-md ml-0">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-4 font-bold text-gray-700">Day</th>
                  <th className="py-2 px-4 font-bold text-gray-700">Start Time</th>
                  <th className="py-2 px-4 font-bold text-gray-700">End Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 text-gray-600">Monday to Saturday</td>
                  <td className="py-2 px-4 text-gray-600">
                    {company.start_time ? formatTime(company.start_time) : 'N/A'}
                  </td>
                  <td className="py-2 px-4 text-gray-600">
                    {company.end_time ? formatTime(company.end_time) : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      {/* Job Details */}
      <section className="space-y-6">
        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <p className="text-gray-600 leading-relaxed">{job.description}</p>
        </div>

        {/* Responsibilities */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
          {job.responsibility?.length ? (
            <ul className="list-disc pl-5 text-gray-600 leading-relaxed space-y-2">
              {job.responsibility.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No responsibilities listed.</p>
          )}
        </div>

        {/* Competencies/Qualifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Competencies</h2>
          {job.qualifications?.length ? (
            <ul className="list-disc pl-5 text-gray-600 leading-relaxed space-y-2">
              {job.qualifications.map((compe, index) => (
                <li key={index}>{compe}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No competencies listed.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default CompanyApplicationApply;
