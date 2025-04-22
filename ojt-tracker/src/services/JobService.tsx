import { supabase } from "../../supabase";

export interface Job {
  job_id: number;
  company_id: string;
  position: string;
  slots: number;
  isAvailable: boolean;
}

export interface Company {
  company_id: string;
  name: string;
}

export const fetchCompanies = async (): Promise<Company[]> => {
  const { data, error } = await supabase.from("company").select("company_id, name");
  if (error) throw error;
  return data || [];
};

export const fetchJobs = async (): Promise<Job[]> => {
  const { data, error } = await supabase.from("job").select("*");
  if (error) throw error;
  return data || [];
};

export const updateJob = async (job: Partial<Job>): Promise<void> => {
  const { error } = await supabase
    .from("job")
    .update(job)
    .eq("job_id", job.job_id!);
  if (error) throw error;
};

export const createJob = async (job: Omit<Job, 'job_id'>): Promise<void> => {
  const { error } = await supabase.from("job").insert([job]);
  if (error) throw error;
};