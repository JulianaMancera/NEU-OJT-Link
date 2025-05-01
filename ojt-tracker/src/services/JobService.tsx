import { supabase } from "../../supabase";

export interface Job {
  job_id: number;
  company_id: string;
  position: string;
  slots: number;                   // Total capacity (editable by admin)
  approved_application_count: number; // Count of approved applications
  available_slots: number;           // Calculated: slots - approved_application_count
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
  // First fetch jobs
  const { data: jobs, error: jobsError } = await supabase.from("job").select("*");
  if (jobsError) throw jobsError;
  if (!jobs) return [];

  // Then fetch approved application counts for all jobs
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

  // Return jobs with updated counts
  return jobs.map(job => ({
    ...job,
    approved_application_count: approvedCounts[job.job_id] || 0,
    available_slots: job.slots - (approvedCounts[job.job_id] || 0)
  }));
};

export const updateJob = async (job: Partial<Job>): Promise<void> => {
  // Calculate available slots before updating
  const jobToUpdate = {
    ...job,
    available_slots: (job.slots || 0) - (job.approved_application_count || 0)
  };

  const { error } = await supabase
    .from("job")
    .update(jobToUpdate)
    .eq("job_id", job.job_id!);
  if (error) throw error;
};

export const createJob = async (job: Omit<Job, 'job_id'>): Promise<void> => {
  const jobToCreate = {
    ...job,
    approved_application_count: 0,
    available_slots: job.slots
  };
  const { error } = await supabase.from("job").insert([jobToCreate]);
  if (error) throw error;
};

export const updateApprovedApplicationCount = async (jobId: string | number): Promise<void> => {
  try {
    console.log(`Starting to update approved application count for job ${jobId}`);
    
    // Get current count of approved applications
    const { count, error } = await supabase
      .from("application")
      .select("*", { count: 'exact' })
      .eq("job_id", jobId)
      .eq("status", "approved");

    if (error) {
      console.error("Error getting application count:", error);
      throw error;
    }

    console.log(`Found ${count} approved applications for job ${jobId}`);

    // Get current job data
    const { data: jobData, error: jobError } = await supabase
      .from("job")
      .select("*")
      .eq("job_id", jobId)
      .single();
    
    if (jobError) {
      console.error("Error fetching job data:", jobError);
      throw jobError;
    }
    
    if (!jobData) {
      console.error(`Job with ID ${jobId} not found`);
      throw new Error(`Job with ID ${jobId} not found`);
    }

    const approvedCount = count || 0;
    
    // Use job.slots if available, otherwise default to 0
    const slots = jobData.slots || 0;
    const availableSlots = Math.max(0, slots - approvedCount);

    console.log(`Job ${jobId} data: slots=${slots}, approved_count=${approvedCount}, available_slots=${availableSlots}`);

    // Update values - handling null values by providing defaults
    const updateData = {
      job_id: jobId,
      approved_application_count: approvedCount,
      available_slots: availableSlots,
      // Only include other fields if they exist in jobData to avoid overwriting with null
      ...(jobData.company_id !== null && { company_id: jobData.company_id }),
      ...(jobData.position !== null && { position: jobData.position }),
      ...(jobData.slots !== null && { slots: jobData.slots }),
      ...(jobData.isAvailable !== null && { isAvailable: jobData.isAvailable })
    };

    // Use update instead of upsert if we know the record exists
    const { error: updateError } = await supabase
      .from("job")
      .update(updateData)
      .eq("job_id", jobId);

    if (updateError) {
      console.error("Error updating job data:", updateError);
      throw updateError;
    }
    
    console.log(`Successfully updated job ${jobId}: approved_count=${approvedCount}, available_slots=${availableSlots}`);
  } catch (error) {
    console.error("Error in updateApprovedApplicationCount:", error);
    throw error;
  }
};

const getJobSlots = async (jobId: string | number): Promise<number> => {
  const { data, error } = await supabase
    .from("job")
    .select("slots")
    .eq("job_id", jobId)
    .single();

  if (error) throw error;
  return data?.slots || 0;
};