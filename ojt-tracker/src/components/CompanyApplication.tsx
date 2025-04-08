
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
    const [jobDetail, setJobDetail] = useState<Job[] |null>(null);
    //User Requirements/Data
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [cv, setCV] = useState<File | null>(null);
    const [com, setCOM] = useState<File | null>(null);
    const [medCert, setMedcert] = useState<File | null>(null);
    const [notarized, setNotarized] = useState<File | null>(null);
    const [psyTest, setPsyTest] = useState<File | null>(null);
    //Checker for User Uploads
    const [cvUploaded, setCVUploaded] = useState(false);
    const [comUploaded, setComUploaded] = useState(false) 
    const [medCertUploaded, setMedcertUploaded] = useState(false) 
    const [notarizeUploaded, setNotarizedUploaded] = useState(false) 
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
        if(!cv || !com  || !medCert || !notarized  || !psyTest){
            alert("Please Upload Both Files")
            return;
        }
        const user = await supabase.auth.getUser();
        //Upload Resume
        const{data:cvData, error:cvError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`cv/${user.data.user?.id}_${company.company_id}_${cv.name}`,cv);
        //Upload Com
        const{data:comData, error:comError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`com/${user.data.user?.id}_${company.company_id}_${com.name}`,com);
        const{data:medCertData, error:medCertError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`medCert/${user.data.user?.id}_${company.company_id}_${medCert.name}`,medCert);
        //Upload Notarize Parent
        const{data:notarizeData, error:notarizeError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`notarized/${user.data.user?.id}_${company.company_id}_${notarized.name}`,notarized);
        //Upload Psy Test
        const{data:psyTestData, error:psyTestError} = await supabase
        .storage
        .from("applicant-documents")
        .upload(`psyTest/${user.data.user?.id}_${company.company_id}_${psyTest.name}`,psyTest);
        //hanlde errors
        if(cvError ){
            console.error("Error Uploadingg", cvError)
        }if(comError ){
            console.error("Error Uploadingg", comError)
        }if(medCertError ){
            console.error("Error Uploadingg", medCertError)
        }if(notarizeError ){
            console.error("Error Uploadingg", notarizeError)
        }if(psyTestError ){
            console.error("Error Uploadingg", psyTestError)
        }
        
        const{data , error} = await supabase.from("requirements").insert([
            {
                student_id: user.data.user?.id,
                created_at: new Date().toISOString(),
                cv_url: cvData?.path,
                com_url : comData?.path,
                medCert_url : medCertData?.path,
                notarize_url : notarizeData?.path,
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
                job_id: selectedJob?.job_id,
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
                    setCV(event.target.files[0]);
                }else if (type == "com"){
                    setCOM(event.target.files[0]);
                }else if (type == "medCert"){
                    setMedcert(event.target.files[0]);
                }else if (type == "notarized"){
                    setNotarized(event.target.files[0]);
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
                    setCVUploaded(true)
                    setComUploaded(true)
                    setMedcertUploaded(true)
                    setNotarizedUploaded(true)
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
                    {cvUploaded && selectedJob ? 
                    <div>You already Submit for this posistion  <EndorsementButton companyProps={{company, onClose}} job={selectedJob}/></div> :
                    <div className="border border-black rounded-lg p-5">
                        <p className="font-semibold">Please Submit Requirements</p>
                        <br />
                        {cvUploaded ? <p>The Resume is Uploaded</p>: 

                        <div className="flex items-center gap-2 mb-4">

                             <File size={20} className="text-black-500" />
                            <label className="font-bold">Resume </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"resume")} />
                        </div> }
                        
                        {comUploaded ? <p>The COM is Uploaded</p>: 
                        <div className="flex items-center gap-2 mb-4">
                            <File size={20} className="text-black-500" />
                            <label className="font-bold">COM </label>
                            <input className="file:bg-[#5fbff9] file:text-black file:rounded-[15px] file:border file:border-black file:px-4 file:py-2 ml-auto cursor-pointer" type="file" accept=".pdf" onChange={(e)=>handleFileChange(e,"com")} />
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