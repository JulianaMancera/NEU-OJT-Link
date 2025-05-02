import { supabase } from "../../supabase";

export interface Job {
  job_id: number;
  company_id: string;
  position: string;
  total_slots: number;
  slots: number | null;
  isAvailable: boolean;
  approved_application_count?: number;
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
  // Fetch jobs
  const { data: jobs, error: jobsError } = await supabase.from("job").select("*");
  if (jobsError) throw jobsError;
  if (!jobs) return [];

  // Fetch approved applications
  const { data: applications, error: appsError } = await supabase
    .from("application")
    .select("job_id")
    .eq("status", "approved");

  if (appsError) throw appsError;

  // Count approved applications per job
  const approvedCounts = applications?.reduce((acc, app) => {
    acc[app.job_id] = (acc[app.job_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>) || {};

  // Return jobs with calculated slots
  return jobs.map(job => ({
    ...job,
    approved_application_count: approvedCounts[job.job_id] || 0,
    slots: job.slots ?? (job.total_slots - (approvedCounts[job.job_id] || 0))
  }));
};

export const updateJob = async (job: Partial<Job>): Promise<void> => {
  const { error } = await supabase
    .from("job")
    .update({
      position: job.position,
      company_id: job.company_id,
      total_slots: job.total_slots,
      slots: job.slots,
      isAvailable: job.isAvailable
    })
    .eq("job_id", job.job_id!);
  if (error) throw error;
};

export const createJob = async (job: Omit<Job, 'job_id'>): Promise<void> => {
  const { error } = await supabase.from("job").insert([{
    ...job,
    slots: job.total_slots
  }]);
  if (error) throw error;
};

export const updateAllJobSlots = async (): Promise<void> => {
  try {
    // Get all jobs
    const { data: jobs, error: jobsError } = await supabase.from("job").select("*");
    if (jobsError) throw jobsError;
    if (!jobs) return;

    // Get all approved applications
    const { data: applications, error: appsError } = await supabase
      .from("application")
      .select("job_id")
      .eq("status", "approved");

    if (appsError) throw appsError;

    // Count approved applications per job
    const approvedCounts = applications?.reduce((acc, app) => {
      acc[app.job_id] = (acc[app.job_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>) || {};

    // Prepare updates - ensure we don't send null
    const updates = jobs.map(job => ({
      job_id: job.job_id,
      slots: job.total_slots - (approvedCounts[job.job_id] || 0)
    }));

    // Execute batch update
    const { error } = await supabase
      .from("job")
      .upsert(updates);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating job slots:", error);
    throw error;
  }
};