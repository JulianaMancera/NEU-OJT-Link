import React from "react";
import Job from "../types/Job";
import Company from "../types/Company";

type StepType = "selectJob" | "apply" | "requirement" | "dashboard";

interface CompanyApplicationApplyProps {
  job: Job;
  company: Company;
  setStep: React.Dispatch<React.SetStateAction<StepType>>;
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
}

const CompanyApplicationApply = ({
  job,
  setStep,
  setSelectedJob,
}: CompanyApplicationApplyProps) => {
  const handleBack = () => {
    setSelectedJob(null);
    setStep("selectJob");
  };

  const handleApply = () => {
    setStep("requirement");
  };

  return (
    <div className="text-black"> 
      <br/>
      <div className="text-center">
      <button
        onClick={handleBack}
        className="mb-4 mr-4 bg-[#5fbff9]"
      >
        Back to Job List
      </button>
      <button
        onClick={handleApply}
        className="mb-4 bg-[#5fbff9]"
      >
        Apply Now
      </button>
      </div>
      <p className="font-bold mt-4 text-[1.4rem]">Position</p>
      <p className="text-black leading-relaxed text-[1.15rem]">{job.position}</p>
      <p className="font-bold mt-3 text-[1.15rem]">Description</p>
      <p className="text-black leading-relaxed border border-black rounded-lg p-4 mt-2">{job.description}</p>
      <p className="font-bold mt-5 text-[1.15rem]">Responsibility</p>
      <div className="border border-black rounded-lg p-4 mt-2">
        <ul className="list-disc leading-relaxed pl-3">
          {job.responsibility?.map((resp, index) => (
            <li key={index}>{resp}</li>
          ))}
        </ul>
      </div>
      <p className="font-bold mt-5 text-[1.15rem]">Competencies</p>
      <div className="border border-black rounded-lg p-4 mt-2">
        <ul className="list-disc text-black leading-relaxed pl-3">
          {job.qualifications?.map((compe, index) => (
            <li key={index}>{compe}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CompanyApplicationApply;