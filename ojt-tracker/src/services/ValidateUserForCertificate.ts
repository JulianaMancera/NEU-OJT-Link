import { supabase } from "../../supabase"

export const ValidateUserForCertificate = async (user: string) => {
  const { data } = await supabase
    .from("user_hours")
    .select("total_hours")
    .eq("user_id", user)
    .single()

  return (data?.total_hours ?? 0) >= 300;
}