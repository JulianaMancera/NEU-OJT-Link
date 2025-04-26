import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import Company from "../types/Company";
import Job from "../types/Job";

type ApplicationStatus = 'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted';

export const useApplicationData = () => {
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('submitted');
  const [initialApplicationStep, setInitialApplicationStep] = useState<string | null>(null);
  const [hasApprovedApplication, setHasApprovedApplication] = useState(false);
  const [approvedCompany, setApprovedCompany] = useState<Company | null>(null);
  const [approvedJob, setApprovedJob] = useState<Job | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    const fetchApplicationData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all applications for the user
      const { data: applications, error } = await supabase
        .from("application")
        .select("application_id, status, company_id, job_id")
        .eq("user_id", user.id);

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      if (applications && applications.length > 0) {
        // Find approved applications
        const approvedApplications = applications.filter(app => app.status === "approved");
        
        if (approvedApplications.length > 1) {
          console.error('Multiple approved applications found:', approvedApplications);
          return;
        }

        // Get the first approved application or the most recent one
        const applicationData = approvedApplications[0] || applications[0];
        setApplicationId(applicationData.application_id);
        
        const { data: availabilityData } = await supabase
          .from("availability")
          .select("*")
          .eq("application_id", applicationData.application_id);
        
        const { data: endorsementData } = await supabase
          .from("endorsement")
          .select("*")
          .eq("application_id", applicationData.application_id);
        
        let currentStatus: ApplicationStatus = 'submitted';
        let initialStep: string | null = null;
        
        if (applicationData.status === "approved") {
          if (endorsementData?.length) {
            currentStatus = 'endorsement_submitted';
            initialStep = "dashboard";
          } else if (availabilityData?.length) {
            currentStatus = 'availability_submitted';
            initialStep = "requirement";
          } else {
            currentStatus = 'approved';
            initialStep = "availability";
          }
        }
        
        setApplicationStatus(currentStatus);
        setInitialApplicationStep(initialStep);
        
        if (applicationData.status === "approved") {
          setHasApprovedApplication(true);
          
          const { data: companyData } = await supabase
            .from("company")
            .select("*")
            .eq("company_id", applicationData.company_id)
            .single();
            
          if (companyData) {
            setApprovedCompany(companyData);
            
            const { data: jobData } = await supabase
              .from("job")
              .select("job_id, position, company_id, created_at, description, responsibility, qualifications, work_hrs, schedule, isAvailable")
              .eq("job_id", applicationData.job_id)
              .single();

            if (jobData) {
              setApprovedJob(jobData as Job);
            }
            
            setShowApprovalModal(true);
          }
        }
      }
    };

    fetchApplicationData();
  }, []);

  useEffect(() => {
    if (!applicationId) return;

    const subscription = supabase
      .channel("application_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "application",
          filter: `application_id=eq.${applicationId}`,
        },
        async (payload) => {
          if (payload.new.status === "approved" && applicationStatus === 'submitted') {
            setHasApprovedApplication(true);
            setApplicationStatus('approved');
            
            const { data: companyData } = await supabase
              .from("company")
              .select("*")
              .eq("company_id", payload.new.company_id)
              .single();
              
            if (companyData) {
              setApprovedCompany(companyData);
              setShowApprovalModal(true);
              setInitialApplicationStep("availability");
              
              const { data: jobData } = await supabase
                .from("job")
                .select("job_id, position, company_id, created_at, description, responsibility, qualifications, work_hrs, schedule, isAvailable")
                .eq("job_id", payload.new.job_id)
                .single();

              if (jobData) {
                setApprovedJob(jobData as Job);
              }
            }
          }
        }
      )
      .subscribe();

    const availabilitySubscription = supabase
      .channel("availability_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "availability",
          filter: `application_id=eq.${applicationId}`,
        },
        () => {
          setApplicationStatus('availability_submitted');
          setInitialApplicationStep("requirement");
        }
      )
      .subscribe();

    const endorsementSubscription = supabase
      .channel("endorsement_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "endorsement",
          filter: `application_id=eq.${applicationId}`,
        },
        () => {
          setApplicationStatus('endorsement_submitted');
          setInitialApplicationStep("dashboard");
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      availabilitySubscription.unsubscribe();
      endorsementSubscription.unsubscribe();
    };
  }, [applicationId, applicationStatus]);

  const updateApplicationStatus = (status: ApplicationStatus) => {
    if (!applicationId) return;
    setApplicationStatus(status);
    
    if (status === 'approved') {
      setInitialApplicationStep("availability");
    } else if (status === 'availability_submitted') {
      setInitialApplicationStep("requirement");
    } else if (status === 'endorsement_submitted') {
      setInitialApplicationStep("dashboard");
    }
  };

  return {
    applicationId,
    applicationStatus,
    initialApplicationStep,
    hasApprovedApplication,
    approvedCompany,
    approvedJob,
    showApprovalModal,
    setShowApprovalModal,
    updateApplicationStatus
  };
}; 