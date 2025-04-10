import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import EndorsementButton from "./EndorsementButton";
import { File } from "lucide-react";

interface CompanyProps {
  company: {
    company_id: string;
    name: string;
    address: string;
    email: string;
    contact_no: string;
  };
  onClose: () => void;
}

interface Job {
  job_id: string;
  company_id: string;
  created_at: string;
  position: string;
  description: string;
  responsibility: string[];
  qualifications: string[];
  work_hrs: string;
  schedule: string;
}

const CompanyApplication = ({ company, onClose }: CompanyProps) => {
  const [step, setStep] = useState<"selectJob" | "apply" | "requirement" | "availability" | "dashboard">("selectJob"); // Add "availability" step
  const [jobDetail, setJobDetail] = useState<Job[] | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null); // Store the application ID
  // User Requirements/Data
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [com, setCOM] = useState<File | null>(null);
  const [cv, setCV] = useState<File | null>(null);
  const [medCert, setMedcert] = useState<File | null>(null);
  const [notarized, setNotarized] = useState<File | null>(null);
  const [psyTest, setPsyTest] = useState<File | null>(null);
  // Checker for User Uploads
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [coverLetterUploaded, setCoverLetterUploaded] = useState(false);
  const [comUploaded, setComUploaded] = useState(false);
  const [cvUploaded, setCVUploaded] = useState(false);
  const [medCertUploaded, setMedcertUploaded] = useState(false);
  const [notarizeUploaded, setNotarizedUploaded] = useState(false);
  const [psyTestUploaded, setPsyTestUploaded] = useState(false);
  // Availability Form State
  const [availability, setAvailability] = useState<{ day: string; startTime: string; endTime: string }[]>([]); // Store multiple availability slots
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentStartTime, setCurrentStartTime] = useState<string>("");
  const [currentEndTime, setCurrentEndTime] = useState<string>("");

  useEffect(() => {
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("job")
        .select("*")
        .eq("company_id", company.company_id);

      if (error) {
        console.error("There is something wrong ", error.message);
      } else {
        console.log(data);
        setJobDetail(data);
      }
    };
    fetchJob();
  }, [company]);

  const handleRequirementSubmit = async () => {
    if (!resume || !coverLetter || !com || !cv || !medCert || !notarized || !psyTest) {
      alert("Please Upload All Files");
      return;
    }
    const user = await supabase.auth.getUser();
    // Upload Resume
    const { data: resumeData, error: resumeError } = await supabase
      .storage
      .from("applicant-documents")
      .upload(`resumes/${user.data.user?.id}_${company.company_id}_${resume.name}`, resume);
    // Upload Cover Letter
    const { data: coverLetterData, error: coverLetterError } = await supabase
      .storage
      .from("applicant-documents")
      .upload(`cover-letter/${user.data.user?.id}_${company.company_id}_${coverLetter.name}`, coverLetter);
    // Upload COM
    const { data: comData, error: comError } = await supabase
      .storage
      .from("applicant-documents")
      .upload(`com/${user.data.user?.id}_${company.company_id}_${com.name}`, com);
    // Upload CV
    const { data: cvData, error: cvError } = await supabase
      .storage
      .from("applicant-documents")
      .upload(`cv/${user.data.user?.id}_${company.company_id}_${cv.name}`, cv);
    // Upload MedCert
    const { data: medCertData, error: medCertError } = await supabase
      .storage
      .from("applicant-documents")
      .upload(`medCert/${user.data.user?.id}_${company.company_id}_${medCert.name}`, medCert);
    // Upload Notarized Parent Consent
    const { data: notarizeData, error: notarizeError } = await supabase
      .storage
      .from("applicant-documents")
      .upload(`notarized/${user.data.user?.id}_${company.company_id}_${notarized.name}`, notarized);
    // Upload Psy Test
    const { data: psyTestData, error: psyTestError } = await supabase
      .storage
      .from("applicant-documents")
      .upload(`psyTest/${user.data.user?.id}_${company.company_id}_${psyTest.name}`, psyTest);

    // Handle errors
    if (resumeError) {
      console.error("Error Uploading Resume", resumeError);
    }
    if (coverLetterError) {
      console.error("Error Uploading Cover Letter", coverLetterError);
    }
    if (comError) {
      console.error("Error Uploading COM", comError);
    }
    if (cvError) {
      console.error("Error Uploading CV", cvError);
    }
    if (medCertError) {
      console.error("Error Uploading MedCert", medCertError);
    }
    if (notarizeError) {
      console.error("Error Uploading Notarized Consent", notarizeError);
    }
    if (psyTestError) {
      console.error("Error Uploading Psy Test", psyTestError);
    }

    const { data, error } = await supabase.from("requirements").insert([
      {
        student_id: user.data.user?.id,
        created_at: new Date().toISOString(),
        resume_url: resumeData?.path,
        cover_letter_url: coverLetterData?.path,
        com_url: comData?.path,
        cv_url: cvData?.path,
        medCert_url: medCertData?.path,
        notarize_url: notarizeData?.path,
        psyTest_url: psyTestData?.path,
        company_id: company.company_id,
        job_id: selectedJob?.job_id,
      },
    ]);
    
    if (error) {
      console.error("Error Submitting Requirements:", error.message);
    } else {
      console.log("Application submitted", data);
      setStep("dashboard");
    }

    // Insert the application record and store the application_id
    const { data: applicationData, error: applicationError } = await supabase.from("application").insert([
      {
        user_id: user.data.user?.id,
        company_id: company.company_id,
        email: user.data.user?.email,
        job_id: selectedJob?.job_id,
        status: "pending",
        start_date: null,
        end_date: null,
      },
    ]).select(); // Use .select() to return the inserted record

    if (applicationError) {
      console.error("Error creating application:", applicationError);
      return;
    }

    if (applicationData && applicationData.length > 0) {
      console.log("Application created:", applicationData);
      setApplicationId(applicationData[0].application_id); // Store the application_id
      setStep("availability"); // Move to the availability step
    }
  };

  const handleAvailabilitySubmit = async () => {
    if (availability.length === 0) {
      alert("Please add at least one availability slot.");
      return;
    }

    // Insert all availability slots into the availability table
    const availabilityEntries = availability.map(slot => ({
      application_id: applicationId,
      day_of_week: slot.day,
      start_time: slot.startTime,
      end_time: slot.endTime,
    }));

    const { data, error } = await supabase
      .from("availability")
      .insert(availabilityEntries);

    if (error) {
      console.error("Error submitting availability:", error.message);
      alert("Failed to submit availability. Please try again.");
      return;
    }

    console.log("Availability submitted:", data);
    setStep("dashboard"); // Move to the dashboard step
  };

  const handleAddAvailabilitySlot = () => {
    if (!currentDay || !currentStartTime || !currentEndTime) {
      alert("Please fill in all availability fields.");
      return;
    }

    // Validate that start time is before end time
    if (currentStartTime >= currentEndTime) {
      alert("Start time must be before end time.");
      return;
    }

    setAvailability([...availability, {
      day: currentDay,
      startTime: currentStartTime,
      endTime: currentEndTime,
    }]);

    // Reset the form fields
    setCurrentDay("");
    setCurrentStartTime("");
    setCurrentEndTime("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (event.target.files && event.target.files[0]) {
      if (type === "resume") {
        setResume(event.target.files[0]);
      } else if (type === "coverLetter") {
        setCoverLetter(event.target.files[0]);
      } else if (type === "com") {
        setCOM(event.target.files[0]);
      } else if (type === "cv") {
        setCV(event.target.files[0]);
      } else if (type === "medCert") {
        setMedcert(event.target.files[0]);
      } else if (type === "notarized") {
        setNotarized(event.target.files[0]);
      } else if (type === "psyTest") {
        setPsyTest(event.target.files[0]);
      }
    }
  };

  const handleSelectedJob = async (job: Job) => {
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
        setResumeUploaded(true);
        setCoverLetterUploaded(true);
        setComUploaded(true);
        setCVUploaded(true);
        setMedcertUploaded(true);
        setNotarizedUploaded(true);
        setPsyTestUploaded(true);
      }
    } else {
      console.log(error);
    }

    setSelectedJob(job);
    setStep("requirement");
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setStep("apply"); // Move to the job details modal
  };

        <div className="flex items-center justify-center">
            {step === "apply" && (
                <div className="text-black">
                <p>Want to apply to {company.name}</p>
                <div className="justify-between">
                { jobDetail && jobDetail.length > 0 ? (
                    jobDetail.map((job, index) => (
                <div key={index} className="mb-6">
                    <button onClick={() => handleSelectedJob(job)} className="text-black !font-semibold !bg-[#5fbff9] !rounded-[1.5em] !border-black">Apply Now</button>
                    <p className="font-bold mt-4 text-[1.15rem]">Position</p>
                    <p className="text-black leading-relaxed">{job?.position}</p>
                    <p className="font-bold mt-3 text-[1.15rem]">Description</p>
                    <p className="text-black leading-relaxed">{job?.description}</p>
                    <p className="font-bold mt-3 text-[1.15rem]">Responsiblity</p>
                    <ul className="list-disc leading-relaxed">
                        {job?.responsibility.map((resp,index)=>(
                            <li key={index}>{resp}</li>
                        ))}
                    </ul>
                    <p className="font-bold mt-3 text-[1.15rem]">Compentencies</p>
                    <ul className="list-disc text-black leading-relaxed">
                        {job?.qualifications.map((compe,index)=>(
                            <li key={index}>{compe}</li>
                        ))}
                    </ul>
                    
                    {/* <button onClick={onClose} className="text-white">Cancel</button> */}
 
                </div>
                    ))
                ) : ( <p>No Jobs Available in this company</p>)

                }
                </div>
               </div>

            )}
            {step === "requirement" && (
                <div className="text-black">
                <p>Company Selected {company.name}</p>
                <p>Position {selectedJob?.position}</p>
                <p>Posistion Selected </p>

                <br />
                    {resumeUploaded && coverLetterUploaded && selectedJob ? 
                    <div>You already Submit for this posistion  <EndorsementButton companyProps={{company, onClose}} job={selectedJob}/></div> :
                    <div className="border border-black rounded-lg p-5">
                        <p className="font-semibold">Please Submit Requirements</p>
                        <br />
                        {resumeUploaded ? <p>The Resume is Uploaded</p>: 

                        <div className="flex items-center gap-2 mb-4">

                             <File size={20} className="text-black-500" />
                            <label className="font-bold">Resume </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"resume")} />
                        </div> }
                        
                        {coverLetterUploaded ? <p>The CoverLetter is Uploaded</p>: 

                        <div className="flex items-center gap-2 mb-4">
                            <File size={20} className="text-black-500"/>
                            <label className="font-bold">Cover Letter </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2 ml-auto cursor-pointer" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"coverLetter")} />
                        </div>}
                        {comUploaded ? <p>The COM is Uploaded</p>: 
                        <div className="flex items-center gap-2 mb-4">
                            <File size={20} className="text-black-500" />
                            <label className="font-bold">COM </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2 ml-auto cursor-pointer" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"com")} />
                        </div>}
                            {cvUploaded ? <p>The CV is Uploaded</p>: 
                        <div className="flex items-center gap-2 mb-4">
                        <File size={20} className="text-black-500" />
                            <label className="font-bold">CV </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2 ml-auto cursor-pointer" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"cv")} />
                        </div>}
                        {medCertUploaded ? <p>The Medcert is Uploaded</p>: 
                        <div className="flex items-center gap-2 mb-4">
                        <File size={20} className="text-black-500" />
                            <label className="font-bold">Med Cert </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2 ml-auto cursor-pointer"type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"medCert")} />
                        </div>}
                        {notarizeUploaded ? <p>The Notartize is Uploaded</p>: 
                        <div className="flex items-center gap-2 mb-4">
                        <File size={20} className="text-black-500" />
                            <label className="font-bold">Notarized Parent Consent </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2 ml-auto cursor-pointer"type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"notarized")} />

                        </div>}
                        
                        {psyTestUploaded ? <p>The Psy Test  is Uploaded</p>: 
                        <div className="flex items-center gap-2">
                        <File size={30} className="text-gray-500" />
                            <label className="font-bold">Psychological Test</label>

                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2 ml-auto cursor-pointer" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"psyTest")} />
                        </div>}

                    </div>
                    }
                    
                    <br />
                        <div>
                            <button onClick={handleRequirementSubmit} className="text-white">Submit</button>
                            <button onClick={onClose} className="text-white">Cancel</button>
                        </div>                                

            <div className="mb-4">
              <label className="font-bold min-w-[150px]">End Time</label>
              <input
                type="time"
                value={currentEndTime}
                onChange={(e) => setCurrentEndTime(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              />
            </div>

            <button
              onClick={handleAddAvailabilitySlot}
              className="text-white bg-green-500 px-4 py-2 rounded mb-4"
            >
              Add Availability Slot
            </button>

            {availability.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold">Added Availability:</p>
                <ul className="list-disc pl-5">
                  {availability.map((slot, index) => (
                    <li key={index}>
                      {slot.day}: {slot.startTime} - {slot.endTime}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <button onClick={handleAvailabilitySubmit} className="text-white bg-blue-500 px-4 py-2 rounded">
              Submit Availability
            </button>
            <button onClick={onClose} className="text-white bg-gray-500 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "dashboard" && (
        <div>
          <p>Application Submitted</p>
        </div>
      )}
    </div>
  );
};

export default CompanyApplication;