
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import EndorsementButton from "./EndorsementButton";
import { File } from "lucide-react";

interface CompanyProps{
    company:{
        company_id:string,
        name:string,
        address:string,
        email: string,
        contact_no: string,
    };    
    onClose: () => void;
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
    const [coverLetter, setCoverLetter] = useState<File | null>(null);
    const [resume, setResume] = useState<File | null>(null);
    const [com, setCOM] = useState<File | null>(null);
    const [cv, setCV] = useState<File | null>(null);
    const [medCert, setMedcert] = useState<File | null>(null);
    const [notarized, setNotarized] = useState<File | null>(null);
    const [poi, setPOI] = useState<File | null>(null);
    const [psyTest, setPsyTest] = useState<File | null>(null);
    //Checker for User Uploads
    const [resumeUploaded, setResumeUploaded] = useState(false);
    const [coverLetterUploaded, setCoverLetterUploaded] = useState(false);
    const [comUploaded, setComUploaded] = useState(false) 
    const [cvUploaded, setCVUploaded] = useState(false) 
    const [medCertUploaded, setMedcertUploaded] = useState(false) 
    const [notarizeUploaded, setNotarizedUploaded] = useState(false) 
    const [poiUploaded, setPoiUploaded] = useState(false) 
    const [psyTestUploaded, setPsyTestUploaded] = useState(false) 

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
        if(!resume || !coverLetter || !com || !cv || !medCert || !notarized || !poi || !psyTest){
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
        //Upload Com
        const{data:comData, error:comError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`com/${user.data.user?.id}_${company.company_id}_${com.name}`,com);
        //Upload CV 
        const{data:cvData, error:cvError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`cv/${user.data.user?.id}_${company.company_id}_${cv.name}`,cv);
        //Upload Medcert
        const{data:medCertData, error:medCertError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`medCert/${user.data.user?.id}_${company.company_id}_${medCert.name}`,medCert);
        //Upload Notarize Parent
        const{data:notarizeData, error:notarizeError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`notarized/${user.data.user?.id}_${company.company_id}_${notarized.name}`,notarized);
        //Upload POI
        const{data:poiData, error:poiError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`poi/${user.data.user?.id}_${company.company_id}_${poi.name}`,poi);
        //Upload Psy Test
        const{data:psyTestData, error:psyTestError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`psyTest/${user.data.user?.id}_${company.company_id}_${psyTest.name}`,psyTest);
        //hanlde errors
        if(resumeError ){
            console.error("Error Uploadingg", resumeError)
        }if(coverLetterError ){
            console.error("Error Uploadingg", coverLetterError)
        }if(comError ){
            console.error("Error Uploadingg", resumeError)
        }if(cvError ){
            console.error("Error Uploadingg", coverLetterError)
        }if(medCertError ){
            console.error("Error Uploadingg", resumeError)
        }if(notarizeError ){
            console.error("Error Uploadingg", coverLetterError)
        }if(poiError ){
            console.error("Error Uploadingg", resumeError)
        }if(psyTestError ){
            console.error("Error Uploadingg", coverLetterError)
        }
        
        const{data , error} = await supabase.from("requirements").insert([
            {
                student_id: user.data.user?.id,
                created_at: new Date().toISOString(),
                resume_url: resumeData?.path,
                cover_letter_url: coverLetterData?.path,
                com_url : comData?.path,
                cv_url : cvData?.path,
                medCert_url : medCertData?.path,
                notarize_url : notarizeData?.path,
                poi_url : poiData?.path,
                psyTest_url : psyTestData?.path,
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
            console.log("success", applicationData)
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
                }else if (type == "com"){
                    setCOM(event.target.files[0]);
                }else if (type == "cv"){
                    setCV(event.target.files[0]);
                }else if (type == "medCert"){
                    setMedcert(event.target.files[0]);
                }else if (type == "notarized"){
                    setNotarized(event.target.files[0]);
                }else if (type == "poi"){
                    setPOI(event.target.files[0]);
                }else if (type == "psyTest"){
                    setPsyTest(event.target.files[0]);
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
                if(data.resume_url && data.cover_letter_url){
                    console.log(data)
                    setResumeUploaded(true)
                    setCoverLetterUploaded(true)
                    setComUploaded(true)
                    setCVUploaded(true)
                    setMedcertUploaded(true)
                    setNotarizedUploaded(true)
                    setPoiUploaded(true)
                    setPsyTestUploaded(true)
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
                <div className="text-black">
                <p>Want to apply to {company.name}</p>
                <div className="justify-between">
                { jobDetail && jobDetail.length > 0 ? (
                    jobDetail.map((job, index) => (
                <div key={index} className="mb-4">
                    <p className="font-bold">Position</p>
                    <p className="text-black">{job?.position}</p>
                    <p className="font-bold">Description</p>
                    <p className="text-black">{job?.description}</p>
                    <p className="font-bold">Responsiblity</p>
                    <ul className="list-disc">
                        {job?.responsibility.map((resp,index)=>(
                            <li key={index}>{resp}</li>
                        ))}
                    </ul>
                    <p className="font-bold">Compentencies</p>
                    <ul className="list-disc text-black">
                        {job?.qualifications.map((compe,index)=>(
                            <li key={index}>{compe}</li>
                        ))}
                    </ul>
                    <button onClick={() => handleSelectedJob(job)} className="text-white">Proceed</button>
                    <button onClick={onClose} className="text-white">Cancel</button>
 
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
                    {resumeUploaded && coverLetterUploaded ? 
                    <div>You already Submit for this posistion  <EndorsementButton/></div> :
                    <div>
                        <p className="font-semibold">Please Submit Requirements</p>
                        {resumeUploaded ? <p>The Resume is Uploaded</p>: 
                        <div className="flex items-center gap-2">
                            <File size={20} className="text-gray-500" />
                            <label className="font-bold">Resume </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"resume")} />
                        </div> }
                        
                        {coverLetterUploaded ? <p>The CoverLetter is Uploaded</p>: 
                        <div className="flex items-center gap-2">
                            <File size={20} className="text-gray-500"/>
                            <label className="font-bold">Cover Letter </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"coverLetter")} />
                        </div>}
                        {comUploaded ? <p>The COM is Uploaded</p>: 
                        <div className="flex items-center gap-2">
                            <File size={20} className="text-gray-500" />
                            <label className="font-bold">COM </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"com")} />
                        </div>}
                            {cvUploaded ? <p>The CV is Uploaded</p>: 
                        <div className="flex items-center gap-2">
                        <File size={20} className="text-gray-500" />
                            <label className="font-bold">CV </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"cv")} />
                        </div>}
                        {medCertUploaded ? <p>The Medcert is Uploaded</p>: 
                        <div className="flex items-center gap-2">
                        <File size={20} className="text-gray-500" />
                            <label className="font-bold">Med Cert </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2"type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"medCert")} />
                        </div>}
                        {notarizeUploaded ? <p>The Notartize is Uploaded</p>: 
                        <div className="flex items-center gap-4">
                        <File size={40} className="text-gray-500" />
                            <label className="font-bold">Notarized Parent Consent </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2"type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"notarized")} />
                        </div>}
                        {poiUploaded ? <p>The POI is Uploaded</p>: 
                        <div className="flex items-center gap-2">
                        <File size={30} className="text-gray-500" />
                            <label className="font-bold">Proof of Assurance</label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"poi")} />
                        </div>}
                        {psyTestUploaded ? <p>The Psy Test  is Uploaded</p>: 
                        <div className="flex items-center gap-2">
                        <File size={30} className="text-gray-500" />
                            <label className="font-bold">Psychological Test</label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"psyTest")} />
                        </div>}
                        <div>
                            <button onClick={handleRequirementSubmit} className="text-white">Submit</button>
                            <button onClick={onClose} className="text-white">Cancel</button>
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

export default CompanyApplication;