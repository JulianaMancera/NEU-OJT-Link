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
      }
    }
  };

  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const ErrorPopup = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-xl font-bold text-red-600 mb-4">Invalid File Format</h3>
          <p className="mb-6">{errorMessage}</p>
          <button 
            onClick={() => setShowErrorPopup(false)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
            OK
          </button>
        </div>
      </div>
    );
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

  // Function to render file icon 
  const renderFileIcon = () => (
    <File size={40} className="text-black-500" />
  );

  const previewFileIcon = () => (
    <Eye size={25} className="text-black-500" />
  );


  return (
    <div className="flex items-center justify-center">
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

      {step === "apply" && (
        <div className="text-black"> 
          <button
            onClick={() => setStep("selectJob")} // Go back to the "Possible Jobs" modal
            className="text-blue-500 mb-4 mr-4"
          >
            Back to Job List
          </button>
          <button
            onClick={() => handleSelectedJob(selectedJob!)} 
            className="text-blue-500 mb-4"
          >
            Apply Now
          </button>
          <p className="font-bold mt-4 text-[1.4rem]">Position</p>
          <p className="text-black leading-relaxed text-[1.15rem]">{selectedJob?.position}</p>
          <p className="font-bold mt-3 text-[1.15rem]">Description</p>
          <p className="text-black leading-relaxed border border-black rounded-lg p-4 mt-2">{selectedJob?.description}</p>
          <p className="font-bold mt-5 text-[1.15rem]">Responsibility</p>
          <div className="border border-black rounded-lg p-4 mt-2">
            <ul className="list-disc text-black leading-relaxed pl-3">
              {selectedJob?.responsibility.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </div>
          <p className="font-bold mt-5 text-[1.15rem]">Competencies</p>
          <div className="border border-black rounded-lg p-4 mt-2">
            <ul className="list-disc text-black leading-relaxed pl-3">
              {selectedJob?.qualifications.map((compe, index) => (
                <li key={index}>{compe}</li>
              ))}
            </ul>
            </div>
          </div>
      )}

      {step === "requirement" && (
        <div className="text-black">
        
          <p className="text-[1rem]">Position: {selectedJob?.position}</p>
          <br />
          {resumeUploaded && coverLetterUploaded && selectedJob ? (
            <div>
              You already submitted for this position 
              <EndorsementButton companyProps={{ company, onClose }} job={selectedJob} />
            </div>
          ) : (
            <div className="border border-black rounded-lg p-10 w-full max-w-[1000px] mx-auto">
              <p className="font-semibold text-center text-[1.2rem] mb-8">Please Submit Requirements</p>
              {showErrorPopup && <ErrorPopup />}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Resume Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Resume
                  </div>
                  {resumeUploaded ? (
                    <p className="text-green-600 text-sm">Uploaded</p>
                  ) : (
                    <>
                      <div className="mb-2 mt-2">
                        {renderFileIcon()}
                      </div>
                      <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "resume")}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-500 text-xs mt-1">
                        {resume ? resume.name : "No file chosen"}
                      </span>
                      {/* Preview Button */}
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
                    </>
                  )}
                </div>

                {/* Cover Letter Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Cover Letter
                  </div>
                  {coverLetterUploaded ? (
                    <p className="text-green-600 text-sm">Uploaded</p>
                  ) : (
                    <>
                      <div className="mb-2 mt-2">
                        {renderFileIcon()}
                      </div>
                      <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "coverLetter")}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-500 text-xs mt-1">
                        {coverLetter ? coverLetter.name : "No file chosen"}
                      </span>
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
                    </>
                  )}
                </div>

                {/* COM Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    COM
                  </div>
                  {comUploaded ? (
                    <p className="text-green-600 text-sm">Uploaded</p>
                  ) : (
                    <>
                      <div className="mb-2 mt-2">
                        {renderFileIcon()}
                      </div>
                      <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "com")}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-500 text-xs mt-1">
                        {com ? com.name : "No file chosen"}
                      </span>
                       {/* Preview Button */}
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
                    </>
                  )}
                </div>

                {/* CV Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Curriculum Vitae
                  </div>
                  {cvUploaded ? (
                    <p className="text-green-600 text-sm">Uploaded</p>
                  ) : (
                    <>
                      <div className="mb-2 mt-2">
                        {renderFileIcon()}
                      </div>
                      <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "cv")}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-500 text-xs mt-1">
                        {cv ? cv.name : "No file chosen"}
                      </span>
                       {/* Preview Button */}
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
                    </>
                  )}
                </div>

                {/* Med Cert Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Medical Certificate
                  </div>
                  {medCertUploaded ? (
                    <p className="text-green-600 text-sm">Uploaded</p>
                  ) : (
                    <>
                      <div className="mb-2 mt-2">
                        {renderFileIcon()}
                      </div>
                      <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "medCert")}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-500 text-xs mt-1">
                        {medCert ? medCert.name : "No file chosen"}
                      </span>
                       {/* Preview Button */}
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
                    </>
                  )}
                </div>

                {/* Notarized Parent Consent Upload */}
                <div className="flex flex-col items-center ">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Notarized Parent Consent
                  </div>
                  {notarizeUploaded ? (
                    <p className="text-green-600 text-sm">Uploaded</p>
                  ) : (
                    <>
                      <div className="mb-2 mt-2">
                        {renderFileIcon()}
                      </div>
                      <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "notarized")}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-500 text-xs mt-1">
                        {notarized ? notarized.name : "No file chosen"}
                      </span>
                       {/* Preview Button */}
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
                    </>
                  )}
                </div>

                {/* Psychological Test Upload */}
                <div className="flex flex-col items-center">
                  <div className="rounded-lg border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold">
                    Psychological Test
                  </div>
                  {psyTestUploaded ? (
                    <p className="text-green-600 text-sm">Uploaded</p>
                  ) : (
                    <>
                      <div className="mb-2 mt-2">
                        {renderFileIcon()}
                      </div>
                      <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, "psyTest")}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-500 text-xs mt-1">
                        {psyTest ? psyTest.name : "No file chosen"}
                      </span>
                       {/* Preview Button */}
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
                    </>
                  )}
                </div>
              </div>
            
            </div>
          )}
            <div className="flex gap-4 mt-8 justify-center">
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