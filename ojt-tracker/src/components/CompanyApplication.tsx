import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

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
    competencies: string[]

}
const CompanyApplication = ({company, onClose}: CompanyProps) => {
    const [step, setStep] = useState<"apply" | "requirement" | "dashboard">("apply");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [requirement, setRequirement] = useState({resume:false,coverLetter: false});
    const [jobDetail, setJobDetail] = useState<Job |null>(null);
    useEffect(() => {
        const fetchJob = async () => {
            const{data, error} = await supabase.from("job").select("*").eq("company_id", company.company_id).single();

            if(error){
                console.error("There is something wrong ",error.message)
            }
            else{
                console.log(data)
                setRequirement
                setJobDetail(data);
            }
            
        }
        

        fetchJob();
    },[company]);

    const handleRequirementSubmit = async () => {
        const user = ((await supabase.auth.getUser()));
        

        const{data , error} = await supabase.from("application").insert([
            {
                user_id: user.data.user?.id,
                company_id: company.company_id,
                email: user.data.user?.email,
                status: "pending",
            }
        ]);

        if(error){
            console.error("Error Wonka :", error.message);
        }else {
            console.log("application submitted", data)
            setStep("dashboard");
        }
    }
    return(
        <div className="flex items-center justify-center">
            {step === "apply" && (
                <div>
                <p>Want to apply to {company.name}</p>
                <div className="justify-between">
                    <p className="font-bold">Position</p>
                    <p>{jobDetail?.position}</p>
                    <p className="font-bold">Description</p>
                    <p>{jobDetail?.description}</p>
                    <p className="font-bold">Responsiblity</p>
                    <ul className="list-disc text-white">
                        {jobDetail?.responsibility.map((resp,index)=>(
                            <li key={index}>{resp}</li>
                        ))}
                    </ul>
                    <p className="font-bold">Compentencies</p>
                    <ul className="list-disc text-white">
                        {jobDetail?.competencies.map((compe,index)=>(
                            <li key={index}>{compe}</li>
                        ))}
                    </ul>
                    <button onClick={() => setStep("requirement")}>Proceed</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
                </div>

            )}
            {step === "requirement" && (
                <div>
                <p>Please Submit Requirement</p>
                <div className="flex justify-between">
                    <button onClick={() => requirement.resume=true}>Resume</button>
                    <button onClick={() => requirement.coverLetter=true}>CoverLetter</button>
                    <button onClick={handleRequirementSubmit}>Submit</button>
                    <button onClick={onClose}>Cancel</button>
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

export default CompanyApplication