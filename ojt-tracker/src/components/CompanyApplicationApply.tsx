import React from 'react';
import { supabase } from '../../supabase';
import Company from '../types/Company';
import Job from '../types/Job';
interface CompanyApplicationProps {
    job: Job;
    company: Company;
    setStep: React.Dispatch<React.SetStateAction<StepType>>;
    setSelectedJob: React.Dispatch<React.SetStateAction<Job|null>>;
    setUploaded: React.Dispatch<React.SetStateAction<boolean>>;

}
type StepType = "selectJob"|"apply"|"requirement"|"availability"|"dashboard"

const CompanyApplicationApply: React.FC<CompanyApplicationProps> = ({job, company, setStep, setUploaded, setSelectedJob}) => {
    const handleSelectedJob = async (job: Job , company : Company) => {
    const user = await supabase.auth.getUser();
    if (!company?.company_id || !user?.data.user?.id || !job?.job_id) {
      console.error("Invalid query parameters");
      return;
    }
    console.log(user.data.user?.id);
    console.log(company.company_id);
    console.log(job.job_id);

    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .eq("student_id", user.data.user?.id)
      .eq("company_id", company.company_id)
      .eq("job_id", job.job_id)
      .single();

    if (data) {
      if (data.resume_url && data.cover_letter_url) {
        console.log(data);
        setUploaded(true)
      }
    } else {
      console.log(error);
    }

    setSelectedJob(job);
    setStep("requirement");
  };


    return(
        <div className="text-black"> 
          <button
            onClick={() => setStep("selectJob")} // Go back to the "Possible Jobs" modal
            className="text-blue-500 mb-4 mr-4"
          >
            Back to Job List
          </button>
          <button
            onClick={() => handleSelectedJob(job, company)} 
            className="text-blue-500 mb-4"
          >
            Apply Now
          </button>
          <p className="font-bold mt-4 text-[1.4rem]">Position</p>
          <p className="text-black leading-relaxed text-[1.15rem]">{job.position}</p>
          <p className="font-bold mt-3 text-[1.15rem]">Description</p>
          <p className="text-black leading-relaxed border border-black rounded-lg p-4 mt-2">{job.description}</p>
          <p className="font-bold mt-5 text-[1.15rem]">Responsibility</p>
          <div className="border border-black rounded-lg p-4 mt-2">
            <ul className="list-disc leading-relaxed pl-3">
              {job?.responsibility.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </div>
          <p className="font-bold mt-5 text-[1.15rem]">Competencies</p>
          <div className="border border-black rounded-lg p-4 mt-2">
            <ul className="list-disc text-black leading-relaxed pl-3">
              {job?.qualifications.map((compe, index) => (
                <li key={index}>{compe}</li>
              ))}
            </ul>
          </div>
        </div>
    )

}

export default CompanyApplicationApply;


