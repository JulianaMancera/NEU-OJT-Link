import { supabase } from "../../../supabase"

const fetchDaen = async  () => {
    const {data} = await supabase
    .from("user")
    .select("*")
    .eq("role", "dean")
    .single()
    if(!data){
        console.log("Unable to fetch dean")
    }
    const dean ={
        user_id: data?.user_id,
        name: data?.name,
        email: data?.email,
        dataReistered: data?.dataRegistered,
        course: data?.course,
        role: data?.rol,
        profilePicture: data?.profilePicture,
    }
    return dean;
}

export default fetchDaen;