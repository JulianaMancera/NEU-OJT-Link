import { useState } from "react"
import { supabase } from "../../supabase";

const EndorsementButton = () => {
    const [loading, setLoading] = useState(false);
    const[error, setError] = useState<string | null>(null);

    const dowloadEndorsement = async ()=> {
        setLoading(true)
        setError(null)

        const {data, error} = await  supabase.storage.from('endorsement').download('Endorsement Letter.docx')
        if (error){
            setError("Error File")
            console.log(error)
        }

        if(data){
            const fileName = "Endorsment Letter"
            const url = window.URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = url
            link.download =  fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        }
        setLoading(false)
   }

    return(
        <div> 
        <button onClick={dowloadEndorsement} disabled={loading}>Dowload Endorsement Template</button>
        {error && <p>There is an error on the server</p>}
        </div>
    )
}

export default EndorsementButton;   