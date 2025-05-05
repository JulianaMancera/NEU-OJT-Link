import { pdf } from "@react-pdf/renderer";
import { supabase } from "../../supabase";
import CertificatePDF from "../services/CertificatePDF";
import { Award } from "lucide-react";


interface CertifacteProps{
    companyInfo: CompanyInfo,
   job: string;
   isAllowed: boolean
}

interface CompanyInfo{
  name: string;
  logo_url: string;
  supervisor: string;
  signature: string;
}
const GenerateCertButton: React.FC<CertifacteProps> = ({companyInfo, job, isAllowed }) =>  {
    const handleDowload = async() =>{
        if(!companyInfo && !job) return

        try{
            const user = await supabase.auth.getUser()
            const userInfo = {
                companyName: companyInfo.name,
                name: user.data.user?.user_metadata?.full_name,
                job: job,
                supervisor: companyInfo.supervisor,
                supervisorSig:companyInfo.signature,
                coordinatorSig:"https://ecearoibslwhyaxuhato.supabase.co/storage/v1/object/public/signatures//15.png",
                leftSide:"https://ecearoibslwhyaxuhato.supabase.co/storage/v1/object/public/template//left.png",
                rightSide:"https://ecearoibslwhyaxuhato.supabase.co/storage/v1/object/public/template//right.png",
                companyLogo: companyInfo.logo_url

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
            <div className="relative group inline-block">
              <button
                onClick={handleDowload}
                disabled={!isAllowed}
                className={`text-white mb-3 px-4 py-2 rounded flex items-center gap-2 text-white mb-4 bg-blue-600 ${
                  isAllowed ? 'bg-green-600 hover:bg-gray-800 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
                }`}
              > <Award className="w-5 h-5" />
                Click to Download Certificate of Completion
              </button>
              {!isAllowed && (
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-gray-800 text-white text-sm rounded px-3 py-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  You need to complete 300 hours to download the certificate.
                </div>
              )}
            </div>
          )
}
export default GenerateCertButton;