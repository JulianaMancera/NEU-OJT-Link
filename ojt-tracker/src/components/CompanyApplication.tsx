import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import EndorsementButton from "./EndorsementButton";

interface CompanyProps{
    company:{
        company_id:string,
        name:string,
        address:string,
        email: string,
        contact_no: string,
    };    onClose: () => void;
}
interface Job{
    job_id: string,
    company_id: string,
    created_at: string,
    position: string,
    description: string,
    responsibility: string[],
    qualifications: string[],
    work_hrs: string,
    schedule: string,

}
const CompanyApplication = ({company, onClose}: CompanyProps) => {
    const [step, setStep] = useState<"apply" | "requirement" | "dashboard">("apply");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [jobDetail, setJobDetail] = useState<Job[] |null>(null);
    //User Requirements/Data
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [resume, setResume] = useState<File | null>(null);
    const [coverLetter, setCoverLetter] = useState<File | null>(null);
    //Checker for User Uploads
    const [resumeUploaded, setResumeUploaded] = useState(false);
    const [coverLetterUploaded, setCoverLetterUploaded] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            const{data, error} = await supabase.from("job").select("*").eq("company_id", company.company_id);

            if(error){
                console.error("There is something wrong ",error.message)
            }
            else{
                console.log(data)
                setJobDetail(data);
            }
            
        }
        fetchJob();
    },[company]);

   
         const handleRequirementSubmit = async () => {
        if(!resume || !coverLetter){
            alert("Please Upload Both Files")
            return;
        }
        const user = await supabase.auth.getUser();
        //Upload Resume
        const{data:resumeData, error:resumeError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`resumes/${user.data.user?.id}_${company.company_id}_${resume.name}`,resume);
        //Upload Cover Letter 
        const{data:coverLetterData, error:coverLetterError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`cover-letter/${user.data.user?.id}_${company.company_id}_${coverLetter.name}`,coverLetter);

        //hanlde errors
        if(resumeError ){
            console.error("Error Uploadingg", resumeError)
        }if(coverLetterError ){
            console.error("Error Uploadingg", coverLetterError)
        }
        

        const{data , error} = await supabase.from("requirements").insert([
            {
                student_id: user.data.user?.id,
                created_at: new Date().toISOString(),
                resume_url: resumeData?.path,
                cover_letter_url: coverLetterData?.path,
                company_id: company.company_id,
                job_id: selectedJob?.job_id,
            }
        ]);

        if(error){
            console.error("Error Wonka :", error.message);
        }else {
            console.log("application submitted", data)
            setStep("dashboard");
        }
        const{data:applicationData , error:appplicationError} = await supabase.from("application").insert([
            {
                user_id: user.data.user?.id,
                company_id: company.company_id,
                email: user.data.user?.email,
                status: "pending",
                start_date: null,
                end_date: null,
            }
        ]);

        if(applicationData){
            console.log("successa", applicationData)
        }else if (appplicationError){
            console.log(error)
        }
        
    }
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type:string) => {
            if(event.target.files && event.target.files[0]){
                if(type == 'resume'){
                    setResume(event.target.files[0]);
                }else if (type == "coverLetter"){
                    setCoverLetter(event.target.files[0]);
                }
            }
        }
    const handleSelectedJob = async (job: Job) => {
            const user = await supabase.auth.getUser()
            if (!company?.company_id || !user?.data.user?.id || !job?.job_id) {
                
                console.error("Invalid query parameters");
                return;
            }
                console.log(user.data.user?.id)
            console.log(company.company_id)
                console.log(job.job_id)


            const {data, error} = await supabase.from("requirements").select("*").
            eq("student_id", user.data.user?.id).
            eq("company_id", company.company_id).
            eq("job_id", job.job_id)
            .single()

            if(data){
                if(data.resume_url){
                    console.log(data)
                    setResumeUploaded(true)
                }
                if(data.cover_letter_url){
                    setCoverLetterUploaded(true)
                }
            }else{
                console.log(error)
            }


        setSelectedJob(job);
        setStep("requirement")
    }
    return(
        <div className="flex items-center justify-center">
            {step === "apply" && (
                <div>
                <p>Want to apply to {company.name}</p>
                <div className="justify-between">
                { jobDetail && jobDetail.length > 0 ? (
                    jobDetail.map((job, index) => (
                <div key={index} className="mb-4">
                    <p className="font-bold">Position</p>
                    <p>{job?.position}</p>
                    <p className="font-bold">Description</p>
                    <p>{job?.description}</p>
                    <p className="font-bold">Responsiblity</p>
                    <ul className="list-disc text-white">
                        {job?.responsibility.map((resp,index)=>(
                            <li key={index}>{resp}</li>
                        ))}
                    </ul>
                    <p className="font-bold">Compentencies</p>
                    <ul className="list-disc text-white">
                        {job?.qualifications.map((compe,index)=>(
                            <li key={index}>{compe}</li>
                        ))}
                    </ul>
                    <button onClick={() => handleSelectedJob(job)}>Proceed</button>
                    <button onClick={onClose}>Cancel</button>
 
                </div>
                    ))
                ) : ( <p>No Jobs Availabel in this company</p>)

                }
                </div>
               </div>

            )}
            {step === "requirement" && (
                <div>
                <p>Company Selected {company.name}</p>
                <p>Position {selectedJob?.position}</p>
                <p>Posistion Selected </p>
                    {resumeUploaded && coverLetterUploaded ? 
                    <div>You already Submit for this posistion  <EndorsementButton/></div> :
                    <div>
                        <p>Please Submit Requirement</p>
                        {resumeUploaded ? <p>The Resume is Uploaded</p>: 
                        <div>
                            <label>Resume </label>
                            <input type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"resume")} />
                        </div> }
                        
                        {coverLetterUploaded ? <p>The CoverLetter is Uploaded</p>: 
                        <div>
                            <label>Cover Letter </label>
                            <input type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"coverLetter")} />
                        </div>}
                        <div>
                            <button onClick={handleRequirementSubmit}>Submit</button>
                            <button onClick={onClose}>Cancel</button>
                        </div>
                    </div>
            

                    }
                                                    
                </div>

            )}
            {step === "dashboard" && (
                <div>
                <p>Application Submited</p>
                </div>

            )}
        </div>
    )
}

export default CompanyApplication