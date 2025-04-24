import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import EndorsementButton from "./EndorsementButton";
import CompanyApplicationApply from "./CompanyApplicationApply";
import FileUploadField from "./FileUploadField";
import { handleEndorsementSubmit as submitEndorsement } from "../services/uploadHandle/handleEndorsementSubmit";
import { useNavigate } from "react-router-dom";
import { Loading } from "./Loading";
import ApplicationStatusModal from "./ApplicationStatusModal";

interface CompanyProps {
  company: {
    company_id: string;
    name: string;
    address: string;
    email: string;
    contact_no: string;
  };
  onClose: () => void;
  hasApprovedApplication?: boolean;
  applicationId?: string | null;
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
  isAvailable: boolean;
}

const CompanyApplication = ({ company, onClose, hasApprovedApplication = false, applicationId: existingApplicationId = null }: CompanyProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<"selectJob" | "apply" | "requirement" | "availability" | "dashboard">("selectJob");
  const [jobDetail, setJobDetail] = useState<Job[] | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(existingApplicationId);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [com, setCOM] = useState<File | null>(null);
  const [cv, setCV] = useState<File | null>(null);
  const [medCert, setMedcert] = useState<File | null>(null);
  const [notarized, setNotarized] = useState<File | null>(null);
  const [psyTest, setPsyTest] = useState<File | null>(null);
  const [endorsement, setEndorsement] = useState<File | null>(null);
  const [endorsementStatus, setEndorsementStatus] = useState<boolean>(false);
  const [requirementUploaded, setUploaded] = useState(false);
  const [availability, setAvailability] = useState<{ day: string; startTime: string; endTime: string }[]>([]);
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentStartTime, setCurrentStartTime] = useState("06:00");
  const [currentEndTime, setCurrentEndTime] = useState("17:00");
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [applicationStatus, setApplicationStatus] = useState<'submitted' | 'approved' | 'rejected'>('submitted');
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false);

  const fileFields = [
    { key: "resume", label: "Resume", file: resume },
    { key: "coverLetter", label: "Cover Letter", file: coverLetter },
    { key: "com", label: "COM", file: com },
    { key: "cv", label: "CV", file: cv },
    { key: "medCert", label: "Med Cert", file: medCert },
    { key: "notarized", label: "Notarized Parent Consent", file: notarized },
    { key: "psyTest", label: "Psychological Test", file: psyTest },
  ];
  const endorsementField = { key: "endorsement", label: "Endorsement Letter", file: endorsement };
  const navigate = useNavigate();

  // Log step changes for debugging
  useEffect(() => {
    console.log("Step changed to:", step);
  }, [step]);

  useEffect(() => {
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("job")
        .select("*")
        .eq("company_id", company.company_id)
        .eq("isAvailable", true);

      if (error) {
        console.error("Error fetching jobs:", error.message);
      } else {
        console.log("Jobs fetched:", data);
        setJobDetail(data);
      }
    };
    fetchJob();
  }, [company]);

  useEffect(() => {
    if (hasApprovedApplication && step === "selectJob") {
      console.log("Application is approved on mount, showing modal");
      setApplicationStatus('approved');
      setShowStatusModal(true);
    }
  }, [hasApprovedApplication, step]);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!applicationId) return;

      const { data, error } = await supabase
        .from("application")
        .select("status")
        .eq("application_id", applicationId)
        .single();

      if (error) {
        console.error("Error checking application status:", error);
        return;
      }

      if (data?.status === "approved" && step !== "availability") {
        console.log("Application status updated to approved via Supabase, showing modal");
        setApplicationStatus('approved');
        setShowStatusModal(true);
      }
    };

    const subscription = supabase
      .channel('application_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'application',
          filter: `application_id=eq.${applicationId}`
        }, 
        (payload) => {
          if (payload.new.status === "approved" && step !== "availability") {
            console.log("Real-time update: Application approved, showing modal");
            setApplicationStatus('approved');
            setShowStatusModal(true);
          }
        }
      )
      .subscribe();

    checkApplicationStatus();

    return () => {
      subscription.unsubscribe();
    };
  }, [applicationId, step]);

  const handleRequirementSubmit = async () => {
    if (!resume || !coverLetter || !com || !cv || !medCert || !notarized || !psyTest) {
      alert("Please Upload All Files");
      return;
    }

    setLoading(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        throw new Error("User not authenticated");
      }

      const uploadPromises = [
        supabase.storage
          .from("applicant-documents")
          .upload(`resumes/${user.data.user.id}_${company.company_id}_${resume.name}`, resume),
        supabase.storage
          .from("applicant-documents")
          .upload(`cover-letter/${user.data.user.id}_${company.company_id}_${coverLetter.name}`, coverLetter),
        supabase.storage
          .from("applicant-documents")
          .upload(`com/${user.data.user.id}_${company.company_id}_${com.name}`, com),
        supabase.storage
          .from("applicant-documents")
          .upload(`cv/${user.data.user.id}_${company.company_id}_${cv.name}`, cv),
        supabase.storage
          .from("applicant-documents")
          .upload(`medCert/${user.data.user.id}_${company.company_id}_${medCert.name}`, medCert),
        supabase.storage
          .from("applicant-documents")
          .upload(`notarized/${user.data.user.id}_${company.company_id}_${notarized.name}`, notarized),
        supabase.storage
          .from("applicant-documents")
          .upload(`psyTest/${user.data.user.id}_${company.company_id}_${psyTest.name}`, psyTest),
      ];

      const uploadResults = await Promise.all(uploadPromises);

      const uploadErrors = uploadResults.map((result, index) => {
        if (result.error) {
          const fileNames = ["Resume", "Cover Letter", "COM", "CV", "Med Cert", "Notarized Parent Consent", "Psychological Test"];
          return `Error uploading ${fileNames[index]}: ${result.error.message}`;
        }
        return null;
      }).filter(error => error !== null);

      if (uploadErrors.length > 0) {
        throw new Error(uploadErrors.join("\n"));
      }

      const [resumeData, coverLetterData, comData, cvData, medCertData, notarizeData, psyTestData] = uploadResults.map(result => result.data);

      if (!resumeData?.path || !coverLetterData?.path || !comData?.path || !cvData?.path || 
          !medCertData?.path || !notarizeData?.path || !psyTestData?.path) {
        throw new Error("One or more file uploads failed to return a valid path");
      }

      const { data, error } = await supabase.from("requirements").insert([
        {
          student_id: user.data.user.id,
          created_at: new Date().toISOString(),
          resume_url: resumeData.path,
          cover_letter_url: coverLetterData.path,
          com_url: comData.path,
          cv_url: cvData.path,
          medCert_url: medCertData.path,
          notarize_url: notarizeData.path,
          psyTest_url: psyTestData.path,
          company_id: company.company_id,
          job_id: selectedJob?.job_id,
        },
      ]);

      if (error) {
        throw new Error(`Error submitting requirements: ${error.message}`);
      }

      console.log("Requirements submitted", data);

      const { data: applicationData, error: applicationError } = await supabase.from("application").insert([
        {
          user_id: user.data.user.id,
          company_id: company.company_id,
          email: user.data.user.email,
          job_id: selectedJob?.job_id,
          status: "pending",
          start_date: null,
          end_date: null,
        },
      ]).select();

      if (applicationError) {
        throw new Error(`Error creating application: ${applicationError.message}`);
      }

      if (applicationData && applicationData.length > 0) {
        console.log("Application created:", applicationData);
        setApplicationId(applicationData[0].application_id);
        setApplicationStatus('submitted');
        setShowStatusModal(true);
      }
    } catch (error: Error) {
      console.error("Submission failed:", error.message);
      alert(`Failed to submit requirements:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilitySubmit = async () => {
    if (availability.length === 0) {
      alert("Please add at least one availability slot.");
      return;
    }

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
    setApplicationStatus('approved');
    setShowStatusModal(true);
  };

  const formatTime = (time24: string | undefined): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const workingHours = {
    start: "06:00",
    end: "17:00",
    toString() {
      return `${formatTime(this.start)} to ${formatTime(this.end)}`;
    }
  };

  const handleAddAvailabilitySlot = () => {
    if (!currentDay) {
      alert("Please select a day");
      return;
    }

    const startTime = currentStartTime || workingHours.start;
    const endTime = currentEndTime || workingHours.end;

    if (startTime < workingHours.start || startTime > workingHours.end || 
        endTime < workingHours.start || endTime > workingHours.end) {
      alert(`Available hours are ${workingHours.toString()}`);
      return;
    }

    if (startTime >= endTime) {
      alert("Start time must be before end time");
      return;
    }

    setAvailability([...availability, { 
      day: currentDay, 
      startTime, 
      endTime 
    }]);

    setCurrentDay("");
    setCurrentStartTime(workingHours.start);
    setCurrentEndTime(workingHours.end);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== 'application/pdf') {
        event.target.value = '';
        setErrorMessage(`Please upload only PDF files for your ${type === "com" ? "Certificate of Matriculation" : type}.`);
        setShowErrorPopup(true);
        return;
      }

      if (type === "resume") setResume(file);
      else if (type === "coverLetter") setCoverLetter(file);
      else if (type === "com") setCOM(file);
      else if (type === "cv") setCV(file);
      else if (type === "medCert") setMedcert(file);
      else if (type === "notarized") setNotarized(file);
      else if (type === "psyTest") setPsyTest(file);
      else if (type === "endorsement") setEndorsement(file);
    }
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setStep("apply");
  };

  const handleEndorsementSubmission = async () => {
    if (endorsement) {
      await submitEndorsement(endorsement, company, setEndorsementStatus, setLoading);
      if (endorsementStatus) {
        setApplicationStatus('approved');
        setShowStatusModal(true);
      }
    }
  };

  return (
    <div className="flex items-center justify-center">
      {loading && <Loading />}
      <ApplicationStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          console.log("Modal closed, applicationStatus:", applicationStatus);
          setShowStatusModal(false);
          if (applicationStatus === 'submitted') {
            onClose();
          }
        }}
        status={applicationStatus}
        companyName={company.name}
        onProceed={() => {
          console.log("onProceed called, current step:", step, "applicationStatus:", applicationStatus);
          setShowStatusModal(false);
          if (applicationStatus === 'approved') {
            console.log("Navigating to availability step");
            setStep('availability');
          }
        }}
      />
      {step === "selectJob" && (
        <div className="text-black">
          <br />
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Possible Jobs</h3>
          {jobDetail && jobDetail.length > 0 ? (
            <div className="space-y-5">
              {jobDetail.map((job, index) => (
                <div
                  key={index}
                  onClick={() => handleJobSelect(job)}
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
        <CompanyApplicationApply 
          job={selectedJob} 
          company={company} 
          setStep={setStep} 
          setUploaded={setUploaded} 
          setSelectedJob={setSelectedJob} 
        />
      )}
      {step === "requirement" && (
        <div className="text-black">
          <p className="text-[1rem] font-semibold">Position: {selectedJob?.position}</p>
          <br />
          {requirementUploaded && selectedJob ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '18px', flexDirection: 'column' }}>
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
              {endorsement && (
                <div className="flex gap-4 mt-8 justify-center">
                  <button onClick={handleEndorsementSubmission} className="text-white bg-black px-4 py-2 rounded">
                    Submit
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="border border-black rounded-lg p-10 w-full max-w-[1000px] mx-auto">
              <p className="font-semibold text-center text-[1.2rem] mb-8">Please Submit Requirements</p>
              {showErrorPopup && errorMessage}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '24px' }}>
                {fileFields.map(({ key, label, file }) => (
                  <div key={key} style={{ width: 'calc(33.333% - 16px)' }}>
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
              </select>
            </div>
            <div className="mb-4">
              <label className="font-bold min-w-[150px]">Start Time</label>
              <input
                type="time"
                value={currentStartTime}
                onChange={(e) => setCurrentStartTime(e.target.value)}
                min={workingHours.start}
                max={workingHours.end}
                className="border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div className="mb-4">
              <label className="font-bold min-w-[150px]">End Time</label>
              <input
                type="time"
                value={currentEndTime}
                onChange={(e) => setCurrentEndTime(e.target.value)}
                min={workingHours.start}
                max={workingHours.end}
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
                      {slot.day}: {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
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