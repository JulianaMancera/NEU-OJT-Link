import { supabase } from "../../../supabase";
import Company from '../../types/Company';

export const handleEndorsementSubmit = async (endorsement: File, company: Company, setStatus: React.Dispatch<React.SetStateAction<boolean>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
    setLoading(true) 
    if (!endorsement) {
      alert("Please Upload All Files");
      return;
    }
    const user = await supabase.auth.getUser();
    // Upload Resume
    const { data: endorsementData, error: endorsementError } = await supabase
      .storage
      .from("applicant-documents")
      .upload(`endorsement-letter/${user.data.user?.id}_/${company.company_id}_${endorsement.name}`, endorsement);
    // Upload Cover Letter
        // Handle errors
    if (endorsementError) {
      console.error("Error Uploading Resume", endorsementError);
    }else
      console.log("Upload Success", endorsementData);
      setStatus(true);
    setLoading(false) 

   
  };

  