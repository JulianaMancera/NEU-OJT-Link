import { supabase } from "../../supabase"

export const ValidateUserForCertificate = async (user : string) =>{
    const {data}  = await supabase
    .from("user_hours")
    .select("total_hours")
    .eq("user_id", user)
    .single()

    console.log("user hrs" ,data?.total_hours);

    if(data?.total_hours === 0){
        return true;
    }else{
        return false;
    }


}