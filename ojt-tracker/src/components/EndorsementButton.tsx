import { pdf } from "@react-pdf/renderer";
import EndorsementPDF from "../services/EndorsementPDF";
import { supabase } from "../../supabase";

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

interface EndorsmentProps{
    companyProps: CompanyProps;
    job: Job;
}
const EndorsementButton: React.FC<EndorsmentProps> = ({companyProps, job}) =>  {
    const handleDowload = async() =>{
        if(!companyProps && !job) return

        try{
            const user = await supabase.auth.getUser()
            const userInfo = {
                name: user.data.user?.user_metadata?.full_name,
                position: job.position,
                company: companyProps.company.name,
                companyAddress: companyProps.company.address,
                companyEmail: companyProps.company.email,
                date: new Date().toISOString().slice(0,10),
                signatureUrl:"https://ecearoibslwhyaxuhato.supabase.co/storage/v1/object/public/signatures//img.png"

            }
            const blob = await pdf(<EndorsementPDF {...userInfo}/>).toBlob();
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = "Endorsement_Letter.pdf"
            link.click();

            URL.revokeObjectURL(url)

        }catch (error){
            console.error("Failed", error)
        }
    }

    return(
        <div> 
            <button className="text-white"onClick={handleDowload}>Click to dowload the endorsement letter</button>
        </div>
    )
}
export default EndorsementButton;
