import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import EndorsementButton from "./EndorsementButton";

import CompanyApplicationApply from "./CompanyApplicationApply";
import FileUploadField from "./FileUploadField";
import { handleEndorsementSubmit } from "../services/uploadHandle/handleEndorsementSubmit";
import {  useNavigate } from "react-router-dom";
import { Loading } from "./Loading";

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
  const [loading, setLoading] = useState<boolean>(false);
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
  const [endorsement, setEndorsement] = useState<File | null>(null);
  const [endorsementStatus, setEndorsementStatus] = useState<boolean>(false);
  // Checker for User Uploads
  const [requirementUploaded, setUploaded] = useState(false);
   // Availability Form State
  const [availability, setAvailability] = useState<{ day: string; startTime: string; endTime: string }[]>([]); // Store multiple availability slots
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentStartTime, setCurrentStartTime] = useState<string>("");
  const [currentEndTime, setCurrentEndTime] = useState<string>("");
  const fileFields = [
    { key: "resume", label: "Resume", file: resume },
    { key: "coverLetter", label: "Cover Letter", file: coverLetter },
    { key: "com", label: "COM", file: com },
    { key: "cv", label: "CV", file: cv },
    { key: "medCert", label: "Med Cert", file: medCert },
    { key: "notarized", label: "Notarized Parent Consent", file: notarized },
    { key: "psyTest", label: "Psychological Test", file: psyTest },
  ];
  const endorsementField =  { key: "endorsement", label: "Endorsement Letter", file: endorsement }
  const navigate = useNavigate();

  //Handle Error
  const [errorMessage,setErrorMessage] = useState<string>("");
  const [showErrorPopup,setShowErrorPopup]= useState<boolean>(false);


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
    setLoading(true)
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
    setLoading(false)
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
      const file = event.target.files[0];
      if (file.type !== 'application/pdf') {
        // Clear the input
        event.target.value = '';
        
        // Show error popup
        setErrorMessage(`Please upload only PDF files for your ${type === "com" ? "Certificate of Matriculation" : type}.`);
        setShowErrorPopup(true);
        return;
      }

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
      }else if (type === "endorsement") {
        setEndorsement(event.target.files[0]);
      }

    }
  };

    const handleJobSelect = (job: Job) => {

    setSelectedJob(job);
    setStep("apply"); // Move to the job details modal
  };

 
  return (
    <div className="flex items-center justify-center">
      {loading &&
        <Loading/>
      }
      {step === "selectJob" && (
        <div className="text-black">
          <br></br>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Possible Jobs</h3>
          {jobDetail && jobDetail.length > 0 ? (
            <div className="space-y-5">
              {jobDetail.map((job, index) => (
                <div
                  key={index}
                  onClick={() => handleJobSelect(job)} // Select the job and move to the job details modal
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition"
                >
                  <h5 className="text-md font-medium text-gray-700">{job.position}</h5>
                </div>
              ))}
            </div>
          ) : (
            <p>No Jobs Available in this company</p>
          )}
        </div>
      )}

      {step === "apply" && selectedJob && (

        <CompanyApplicationApply job={selectedJob} company={company} setStep={setStep} setUploaded={setUploaded} setSelectedJob={setSelectedJob} />
        
      )}

      {step === "requirement" && (
        <div className="text-black">
        
          <p className="text-[1rem] font-semibold">Position: {selectedJob?.position}</p>
          <br />
          {requirementUploaded && selectedJob ? (
            <>
            <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '18px', flexDirection: 'column',}}>
              You already submitted for this position 
              <EndorsementButton companyProps={{ company, onClose }} job={selectedJob} />
               <FileUploadField
               key={endorsementField.key}
               label={endorsementField.label}
               fieldKey={endorsementField.key}
               file={endorsementField.file}
               onChange={handleFileChange}
             />
            </div>
            {endorsement && 
             <div className="flex gap-4 mt-8 justify-center">
                <button onClick={() => handleEndorsementSubmit(endorsement, company, setEndorsementStatus,setLoading)} className="text-white bg-black px-4 py-2 rounded">
                  Submit
                </button>
            
              </div>
            }
            {endorsementStatus && 
            <div>
                <button className="text-white"onClick={() => navigate('/student-dashboard')}>Proceed to the Dashboard</button>
            </div>
              
            }
            
              </>
          ) : (
            <div className="border border-black rounded-lg p-10 w-full max-w-[1000px] mx-auto">
              <p className="font-semibold text-center text-[1.2rem] mb-8">Please Submit Requirements</p>
              {showErrorPopup && 
                errorMessage
              }
               <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '24px'}}>
              {fileFields.map(({ key, label, file }) => (
              <div key={key} style={{width: 'calc(33.333% - 16px)'}}>
                <FileUploadField
                  label={label}
                  fieldKey={key}
                  file={file}
                  onChange={handleFileChange}
                />
              </div>
           ))}
                </div>
             <div className="flex gap-4 mt-8 justify-center">
                <button onClick={handleRequirementSubmit} className="text-white bg-black px-4 py-2 rounded">
                  Submit
                </button>
                <button onClick={onClose} className="text-white bg-black px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </div>
          )}
           
        </div>
      )}


          {step === "availability" && (
        <div className="text-black">
          <p className="text-center text-xl font-bold mb-4">Add Your OJT Availability</p>
          <div className="border border-black rounded-lg p-5 w-[600px]">
            <div className="mb-4">
              <label className="font-bold min-w-[150px]">Day of Week</label>
              <select
                value={currentDay}
                onChange={(e) => setCurrentDay(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="">Select a day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="font-bold min-w-[150px]">Start Time</label>
              <input
                type="time"
                value={currentStartTime}
                onChange={(e) => setCurrentStartTime(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              />
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