import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import Company from "../types/Company";
import Job from "../types/Job";

type ApplicationStatus = 'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted' | 'rejected';

export const useApplicationData = () => {
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('submitted');
  const [initialApplicationStep, setInitialApplicationStep] = useState<string | null>(null);
  const [hasApprovedApplication, setHasApprovedApplication] = useState(false);
  const [approvedCompany, setApprovedCompany] = useState<Company | null>(null);
  const [approvedJob, setApprovedJob] = useState<Job | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showEndorsementSuccessModal, setShowEndorsementSuccessModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [rejectedCompanies, setRejectedCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const fetchApplicationData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profile")
        .select("full_name, first_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.first_name || profile.full_name || "")
      }

      const { data: applications, error } = await supabase
        .from("application")
        .select("application_id, status, company_id, job_id")
        .eq("user_id", user.id);

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      if (applications && applications.length > 0) {
        const rejectedApplications = applications.filter(app => app.status === "rejected");
        const approvedApplications = applications.filter(app => app.status === "approved");

        if (rejectedApplications.length > 0) {
          const uniqueCompanyIds = [...new Set(rejectedApplications.map(app => app.company_id))];
          const rejectedCompanyPromises = uniqueCompanyIds.map(companyId => 
            supabase
              .from("company")
              .select("*")
              .eq("company_id", companyId)
              .single()
          );
          
          const rejectedCompanyResults = await Promise.all(rejectedCompanyPromises);
          const fetchedRejectedCompanies = rejectedCompanyResults
            .filter(result => !result.error && result.data)
            .map(result => result.data);
          
          setRejectedCompanies(fetchedRejectedCompanies);
          
          const applicationData = rejectedApplications[0];
          setApplicationId(applicationData.application_id);
          setApplicationStatus('rejected');
          setInitialApplicationStep(null);
          
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
          return;
        }
        
        if (approvedApplications.length > 0) {
          const applicationData = approvedApplications[0];
          setApplicationId(applicationData.application_id);

          const { data: availabilityData } = await supabase
            .from("availability")
            .select("*")
            .eq("application_id", applicationData.application_id);

          const { data: requirementsData } = await supabase
            .from("requirements")
            .select("*")
            .eq("student_id", user.id)
            .eq("job_id", applicationData.job_id);

          let currentStatus: ApplicationStatus = 'submitted';
          let initialStep: string | null = null;

          if (applicationData.status === "approved") {
            if (requirementsData?.length && requirementsData[0].endorsement_url) {
              currentStatus = 'endorsement_submitted';
              initialStep = "dashboard";
              setShowEndorsementSuccessModal(true);
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
        } else if (applications.length > 0) {
          const applicationData = applications[0];
          setApplicationId(applicationData.application_id);
        }
      }
    };

    fetchApplicationData();
  }, []);

  useEffect(() => {
    if (!applicationId) return;

    const setupSubscriptions = async () => {
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
            } else if (payload.new.status === "rejected") {
              setApplicationStatus("rejected");
              setInitialApplicationStep(null);
              
              const { data: companyData } = await supabase
                .from("company")
                .select("*")
                .eq("company_id", payload.new.company_id)
                .single();

              if (companyData) {
                setApprovedCompany(companyData);
                
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { data: rejectedApps } = await supabase
                    .from("application")
                    .select("company_id")
                    .eq("user_id", user.id)
                    .eq("status", "rejected");
                    
                  if (rejectedApps && rejectedApps.length > 0) {
                    const uniqueCompanyIds = [...new Set(rejectedApps.map(app => app.company_id))];
                    
                    const rejectedCompanyPromises = uniqueCompanyIds.map(companyId => 
                      supabase
                        .from("company")
                        .select("*")
                        .eq("company_id", companyId)
                        .single()
                    );
                    
                    const rejectedCompanyResults = await Promise.all(rejectedCompanyPromises);
                    const fetchedRejectedCompanies = rejectedCompanyResults
                      .filter(result => !result.error && result.data)
                      .map(result => result.data);
                    
                    setRejectedCompanies(fetchedRejectedCompanies);
                  }
                }
                
                setShowApprovalModal(true);

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

      const { data: { user } } = await supabase.auth.getUser();
      const { data: application } = await supabase
        .from("application")
        .select("job_id")
        .eq("application_id", applicationId)
        .single();

      if (user && application) {
        const requirementsSubscription = supabase
          .channel("requirements_changes")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "requirements",
              filter: `student_id=eq.${user.id} AND job_id=eq.${application.job_id}`,
            },
            (payload) => {
              if (payload.new.endorsement_url) {
                setApplicationStatus('endorsement_submitted');
                setInitialApplicationStep("dashboard");
                setShowEndorsementSuccessModal(true);
              }
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
          availabilitySubscription.unsubscribe();
          requirementsSubscription.unsubscribe();
        };
      }

      return () => {
        subscription.unsubscribe();
        availabilitySubscription.unsubscribe();
      };
    };

    setupSubscriptions();
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
    } else if (status === 'rejected') {
      setInitialApplicationStep(null);
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
    showEndorsementSuccessModal,
    setShowEndorsementSuccessModal,
    userName,
    updateApplicationStatus,
    rejectedCompanies
  };
};