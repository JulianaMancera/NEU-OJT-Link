import { supabase } from "../../../supabase";
import Company from "../../types/Company";

export const handleEndorsementSubmit = async (
  endorsement: File,
  company: Company,
  setStatus: React.Dispatch<React.SetStateAction<boolean>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoading(true);

  try {
    if (!endorsement) {
      alert("Please upload the endorsement letter.");
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userError || !userId) throw new Error("User not authenticated.");

    // Construct storage path
    const filePath = `endorsement-letter/${userId}/${company.company_id}_${endorsement.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("applicant-documents")
      .upload(filePath, endorsement);

    if (uploadError) throw uploadError;

    // Construct public file URL
    const { publicUrl } = supabase.storage
      .from("applicant-documents")
      .getPublicUrl(filePath).data;

    // Update database with the public file URL
    const { error: updateError } = await supabase
      .from("requirements") // replace with your actual table name if different
      .update({ endorsement_url: publicUrl })
      .eq("student_id", userId)
      .eq("company_id", company.company_id);

    if (updateError) throw updateError;

    setStatus(true);
  } catch (error) {
    console.error("Upload or update failed:", error);
    setStatus(false);
  } finally {
    setLoading(false);
  }
};
