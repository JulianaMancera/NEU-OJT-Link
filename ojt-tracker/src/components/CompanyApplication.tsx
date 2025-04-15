import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import EndorsementButton from "./EndorsementButton";
import { File, Eye } from "lucide-react";

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
  const [step, setStep] = useState<"selectJob" | "apply" | "requirement" | "availability" | "dashboard">("selectJob");
  const [jobDetail, setJobDetail] = useState<Job[] | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  // User Requirements/Data
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [com, setCOM] = useState<File | null>(null);
  const [cv, setCV] = useState<File | null>(null);
  const [medCert, setMedcert] = useState<File | null>(null);
  const [notarized, setNotarized] = useState<File | null>(null);
  const [psyTest, setPsyTest] = useState<File | null>(null);
  // Checker for User Uploads
  const [requirementUploaded, setUploaded] = useState(false);
  // Availability Form State
  const [availability, setAvailability] = useState<{ day: string; startTime: string; endTime: string }[]>([]);
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentStartTime, setCurrentStartTime] = useState("06:00");
  const [currentEndTime, setCurrentEndTime] = useState("17:00");
  // Error Popup State
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("job")
        .select("*")
        .eq("company_id", company.company_id);

      if (error) {
        console.error("Error fetching jobs:", error.message);
      } else {
        setJobDetail(data);
      }
    };
    fetchJob();
  }, [company]);

  const handleRequirementSubmit = async () => {
    if (!resume || !coverLetter || !com || !cv || !medCert || !notarized || !psyTest) {
      alert("Please upload all required files.");
      return;
    }
    const user = await supabase.auth.getUser();
    if (!user.data.user?.id) {
      alert("User not authenticated.");
      return;
    }

    // Upload files
    const uploads = await Promise.all([
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
    ]);

    const errors = uploads.map((result) => result.error).filter(Boolean);
    if (errors.length > 0) {
      console.error("File upload errors:", errors);
      alert("Failed to upload one or more files.");
      return;
    }

    const [resumeData, coverLetterData, comData, cvData, medCertData, notarizeData, psyTestData] = uploads.map(
      (result) => result.data
    );

    // Insert requirements
    const { error: reqError } = await supabase.from("requirements").insert([
      {
        student_id: user.data.user.id,
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

    if (reqError) {
      console.error("Error submitting requirements:", reqError.message);
      alert("Failed to submit requirements.");
      return;
    }

    // Insert application
    const { data: applicationData, error: applicationError } = await supabase
      .from("application")
      .insert([
        {
          user_id: user.data.user.id,
          company_id: company.company_id,
          email: user.data.user.email,
          job_id: selectedJob?.job_id,
          status: "pending",
          start_date: null,
          end_date: null,
        },
      ])
      .select();

    if (applicationError) {
      console.error("Error creating application:", applicationError.message);
      alert("Failed to create application.");
      return;
    }

    if (applicationData && applicationData.length > 0) {
      setApplicationId(applicationData[0].application_id);
      setUploaded(true);
      setStep("availability");
    } else {
      console.error("Failed to retrieve application ID");
      alert("Application creation failed.");
    }
  };

  const handleAvailabilitySubmit = async () => {
    if (availability.length === 0) {
      alert("Please add at least one availability slot.");
      return;
    }

    const availabilityEntries = availability.map((slot) => ({
      application_id: applicationId,
      day_of_week: slot.day,
      start_time: slot.startTime,
      end_time: slot.endTime,
    }));

    const { error } = await supabase.from("availability").insert(availabilityEntries);

    if (error) {
      console.error("Error submitting availability:", error.message);
      alert("Failed to submit availability.");
      return;
    }

    setStep("dashboard");
  };

  const formatTime = (time24: string | undefined): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  //temporary lang pi
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
      if (!file.name.endsWith(".pdf")) {
        event.target.value = "";
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
    }
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setStep("apply");
  };

  const renderFileIcon = () => <File size={40} className="text-black-500" />;
  const previewFileIcon = () => <Eye size={25} className="text-black-500" />;

  const ErrorPopup = () => (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center">
      {errorMessage}
      <button onClick={() => setShowErrorPopup(false)} className="ml-4 underline">
        Close
      </button>
    </div>
  );

  return (
    <div className="flex items-center justify-center">
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

      {step === "apply" && (
        <div className="text-black">
          <button onClick={() => setStep("selectJob")} className="text-blue-500 mb-4 mr-4">
            Back to Job List
          </button>
          <button onClick={() => setStep("requirement")} className="text-blue-500 mb-4">
            Apply Now
          </button>
          <p className="font-bold mt-4 text-[1.4rem]">Position</p>
          <p className="text-black leading-relaxed text-[1.15rem]">{selectedJob?.position || "No job selected"}</p>
          <p className="font-bold mt-3 text-[1.15rem]">Description</p>
          <p className="text-black leading-relaxed border border-black rounded-lg p-4 mt-2">
            {selectedJob?.description || "No description available"}
          </p>
          <p className="font-bold mt-5 text-[1.15rem]">Responsibility</p>
          <div className="border border-black rounded-lg p-4 mt-2">
            <ul className="list-disc text-black leading-relaxed pl-3">
              {selectedJob?.responsibility.map((resp, index) => (
                <li key={index}>{resp}</li>
              )) || <li>No responsibilities listed</li>}
            </ul>
          </div>
          <p className="font-bold mt-5 text-[1.15rem]">Competencies</p>
          <div className="border border-black rounded-lg p-4 mt-2">
            <ul className="list-disc text-black leading-relaxed pl-3">
              {selectedJob?.qualifications.map((compe, index) => (
                <li key={index}>{compe}</li>
              )) || <li>No qualifications listed</li>}
            </ul>
          </div>
        </div>
      )}

      {step === "requirement" && (
        <div className="text-black">
          <p className="text-center text-xl font-bold mb-4">{company.name}</p>
          <p>Position: {selectedJob?.position || "No job selected"}</p>
          <br />
          {showErrorPopup && <ErrorPopup />}
          {requirementUploaded && selectedJob ? (
            <div>
              You already submitted for this position
              <EndorsementButton companyProps={{ company, onClose }} job={selectedJob} />
            </div>
          ) : (
            <div className="border border-black rounded-lg p-10 w-full max-w-[1000px] mx-auto">
              <p className="font-semibold text-center text-[1.2rem] mb-8">Please Submit Requirements</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Resume Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Resume
                  </div>
                  <div className="mb-2 mt-2">{renderFileIcon()}</div>
                  <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                    Upload PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "resume")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-gray-500 text-xs mt-1">{resume ? resume.name : "No file chosen"}</span>
                  {resume && (
                    <label
                      className="mt-2 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => {
                        const fileURL = URL.createObjectURL(resume);
                        window.open(fileURL, "_blank");
                      }}
                    >
                      {previewFileIcon()}
                    </label>
                  )}
                </div>

                {/* Cover Letter Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Cover Letter
                  </div>
                  <div className="mb-2 mt-2">{renderFileIcon()}</div>
                  <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                    Upload PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "coverLetter")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-gray-500 text-xs mt-1">{coverLetter ? coverLetter.name : "No file chosen"}</span>
                  {coverLetter && (
                    <label
                      className="mt-2 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => {
                        const fileURL = URL.createObjectURL(coverLetter);
                        window.open(fileURL, "_blank");
                      }}
                    >
                      {previewFileIcon()}
                    </label>
                  )}
                </div>

                {/* COM Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    COM
                  </div>
                  <div className="mb-2 mt-2">{renderFileIcon()}</div>
                  <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                    Upload PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "com")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-gray-500 text-xs mt-1">{com ? com.name : "No file chosen"}</span>
                  {com && (
                    <label
                      className="mt-2 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => {
                        const fileURL = URL.createObjectURL(com);
                        window.open(fileURL, "_blank");
                      }}
                    >
                      {previewFileIcon()}
                    </label>
                  )}
                </div>

                {/* CV Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Curriculum Vitae
                  </div>
                  <div className="mb-2 mt-2">{renderFileIcon()}</div>
                  <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                    Upload PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "cv")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-gray-500 text-xs mt-1">{cv ? cv.name : "No file chosen"}</span>
                  {cv && (
                    <label
                      className="mt-2 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => {
                        const fileURL = URL.createObjectURL(cv);
                        window.open(fileURL, "_blank");
                      }}
                    >
                      {previewFileIcon()}
                    </label>
                  )}
                </div>

                {/* Med Cert Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Medical Certificate
                  </div>
                  <div className="mb-2 mt-2">{renderFileIcon()}</div>
                  <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                    Upload PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "medCert")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-gray-500 text-xs mt-1">{medCert ? medCert.name : "No file chosen"}</span>
                  {medCert && (
                    <label
                      className="mt-2 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => {
                        const fileURL = URL.createObjectURL(medCert);
                        window.open(fileURL, "_blank");
                      }}
                    >
                      {previewFileIcon()}
                    </label>
                  )}
                </div>

                {/* Notarized Parent Consent Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Notarized Parent Consent
                  </div>
                  <div className="mb-2 mt-2">{renderFileIcon()}</div>
                  <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                    Upload PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "notarized")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-gray-500 text-xs mt-1">{notarized ? notarized.name : "No file chosen"}</span>
                  {notarized && (
                    <label
                      className="mt-2 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => {
                        const fileURL = URL.createObjectURL(notarized);
                        window.open(fileURL, "_blank");
                      }}
                    >
                      {previewFileIcon()}
                    </label>
                  )}
                </div>

                {/* Psychological Test Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Psychological Test
                  </div>
                  <div className="mb-2 mt-2">{renderFileIcon()}</div>
                  <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                    Upload PDF
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "psyTest")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-gray-500 text-xs mt-1">{psyTest ? psyTest.name : "No file chosen"}</span>
                  {psyTest && (
                    <label
                      className="mt-2 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform duration-200"
                      onClick={() => {
                        const fileURL = URL.createObjectURL(psyTest);
                        window.open(fileURL, "_blank");
                      }}
                    >
                      {previewFileIcon()}
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
          <br />
          <div className="flex gap-4 mt-4 justify-center">
            <button onClick={handleRequirementSubmit} className="text-white bg-blue-500 px-4 py-2 rounded">
              Submit
            </button>
            <button onClick={onClose} className="text-white bg-gray-500 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
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
          <button onClick={onClose} className="text-white bg-gray-500 px-4 py-2 rounded mt-4">
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default CompanyApplication;