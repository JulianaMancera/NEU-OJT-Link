import React from "react";
import { ArrowLeft } from "lucide-react";
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