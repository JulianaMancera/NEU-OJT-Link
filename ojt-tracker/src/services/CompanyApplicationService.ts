import { supabase } from "../../supabase";
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
export const fetchJob = async (company_id: string) => {
            const{data, error} = await supabase.from("job").select("*").eq("company_id", company_id);

            if(error){
                console.error("There is something wrong ",error.message)
            }
            else{
                console.log(data)
                return data as Job[];
            }
}
