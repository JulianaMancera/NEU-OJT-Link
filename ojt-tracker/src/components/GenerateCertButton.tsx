import { pdf } from "@react-pdf/renderer";
import { supabase } from "../../supabase";
import CertificatePDF from "../services/CertificatePDF";



interface CertifacteProps{
    companyName: string;
    job: string;
}
const GenerateCertButton: React.FC<CertifacteProps> = ({companyName, job}) =>  {
    const handleDowload = async() =>{
        if(!companyName && !job) return

        try{
            const user = await supabase.auth.getUser()
            const userInfo = {
                companyName: companyName,
                name: user.data.user?.user_metadata?.full_name,
                job: job,
                supervisorSig:"https://ecearoibslwhyaxuhato.supabase.co/storage/v1/object/public/signatures//img.png",
                coordinatorSig:"https://ecearoibslwhyaxuhato.supabase.co/storage/v1/object/public/signatures//img.png"

            }
            const blob = await pdf(<CertificatePDF {...userInfo}/>).toBlob();
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = "Panggap Certificate.pdf"
            link.click();

            URL.revokeObjectURL(url)

        }catch (error){
            console.error("Failed", error)
        }
    }

    return(
        <div> 
            <button className="text-white mb-3 bg-black"onClick={handleDowload}>Click to Download Certificate of Completion</button>
        </div>
    )
}
export default GenerateCertButton;