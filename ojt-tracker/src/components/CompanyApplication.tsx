import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types/Job';
import { Company } from '../types/Company';
import CompanyApplicationApply from './CompanyApplicationApply';
import RequirementForm from './RequirementForm';
import ApplicationStatusModal from './ApplicationStatusModal';
import ApplicationInProgressModal from './ApplicationInProgressModal';
import { Loading } from './Loading';
import { supabase } from '../../supabase';

interface CompanyApplicationProps {
  company: Company;
  onClose: () => void;
  hasApprovedApplication?: boolean;
  applicationId?: string | null;
  initialStep?: 'selectJob' | 'apply' | 'requirement' | 'dashboard';
}

interface UserApplication {
  job_id: string;
  status: string;
  application_id?: string;
}

const CompanyApplication: React.FC<CompanyApplicationProps> = ({
  company,
  onClose,
  initialStep = 'selectJob',
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'selectJob' | 'apply' | 'requirement' | 'dashboard'>(initialStep);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showInProgressModal, setShowInProgressModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<
    'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted'
  >('submitted');
  const [loading, setLoading] = useState(false);
  const [userApplications, setUserApplications] = useState<UserApplication[]>([]);

  const fetchUserApplications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { data: applications, error } = await supabase
        .from('application')
        .select('job_id, status, application_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user applications:', error);
        return;
      }

      setUserApplications(applications || []);
    } catch (error) {
      console.error('Error in fetchUserApplications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserApplications();
  }, []);

  useEffect(() => {
    console.log('showInProgressModal state:', showInProgressModal);
  }, [showInProgressModal]);

  const handleJobSelect = (job: Job) => {
    try {
      const existingApplication = userApplications.find((app) => app.job_id === job.job_id);

      if (existingApplication) {
        alert(`You have already applied to this job. Current status: ${existingApplication.status}`);
        return;
      }

      setSelectedJob(job);
      setStep('apply');
    } catch (error) {
      console.error('Error in handleJobSelect:', error);
    }
  };

  const handleRequirementSubmit = async (files: File[]) => {
    setLoading(true);
    console.log('CompanyApplication: handleRequirementSubmit called with files:', files);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedJob) {
        throw new Error('User or selected job not found');
      }

      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const uniqueId = `${timestamp}_${randomString}`;

      console.log('Starting file uploads...');
      const fileFields = [
        'resume',
        'coverLetter',
        'com',
        'cv',
        'medCert',
        'notarized',
        'psyTest',
      ];
      
      const uploadPromises = files.map(async (file, index) => {
        const fieldKey = fileFields[index] || `file_${index}`;
        const fileExtension = file.name.split('.').pop();
        const uniqueFilename = `${fieldKey}_${user.id}_${company.company_id}_${uniqueId}.${fileExtension}`;
        const filePath = `${fieldKey}/${uniqueFilename}`;

        console.log(`Uploading file: ${filePath}`);
        const { data, error } = await supabase.storage
          .from('applicant-documents')
          .upload(filePath, file);

        if (error) {
          console.error(`Error uploading ${fieldKey}:`, error);
          throw error;
        }
        console.log(`Successfully uploaded ${fieldKey}:`, data?.path);
        return data?.path;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', uploadedPaths);

      console.log('Creating application record...');
      const { data: applicationData, error: applicationError } = await supabase
        .from('application')
        .insert([
          {
            user_id: user.id,
            company_id: company.company_id,
            email: user.email,
            job_id: selectedJob.job_id,
            status: 'pending',
            start_date: null,
            end_date: null,
          },
        ])
        .select()
        .single();

      if (applicationError) {
        console.error('Error creating application:', applicationError);
        throw new Error('Failed to create application');
      }
      console.log('Application created successfully:', applicationData);

      console.log('Creating requirements record...');
      const { error: requirementsError } = await supabase.from('requirements').insert([
        {
          student_id: user.id,
          created_at: new Date().toISOString(),
          resume_url: uploadedPaths[0] || null,
          cover_letter_url: uploadedPaths[1] || null,
          com_url: uploadedPaths[2] || null,
          cv_url: uploadedPaths[3] || null,
          medCert_url: uploadedPaths[4] || null,
          notarize_url: uploadedPaths[5] || null,
          psyTest_url: uploadedPaths[6] || null,
          company_id: company.company_id,
          job_id: selectedJob.job_id,
        },
      ]);

      if (requirementsError) {
        console.error('Error creating requirements:', requirementsError);
        await supabase
          .from('application')
          .delete()
          .eq('application_id', applicationData.application_id);
        throw new Error('Failed to create requirements');
      }
      console.log('Requirements created successfully');

      console.log('Updating localStorage with application data...');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedApplications = [
        ...(userData.applications || []),
        {
          company_id: company.company_id,
          job_id: selectedJob.job_id,
          status: 'submitted',
          date: new Date().toISOString(),
        },
      ];

      localStorage.setItem(
        'userData',
        JSON.stringify({
          ...userData,
          applications: updatedApplications,
        })
      );
      console.log('Successfully updated localStorage');

      await fetchUserApplications();

      setApplicationStatus('submitted');
      setShowInProgressModal(true);
      setStep('dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in handleRequirementSubmit:', errorMessage);
      setShowInProgressModal(true);
      setStep('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowStatusModal(false);
    setShowInProgressModal(false);
    console.log('Modal closed, navigating to dashboard');
    onClose();
    setTimeout(() => navigate('/dashboard'), 500);
  };

  const handleStatusUpdate = (
    status: 'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted'
  ) => {
    setApplicationStatus(status);
  };

  const hasApplied = selectedJob
    ? userApplications.some((app) => app.job_id === selectedJob.job_id && app.status !== 'rejected')
    : false;

  return (
    <div className="flex items-center justify-center">
      {loading && <Loading />}
      {step === 'selectJob' && (
        <div className="text-black">
          <br />
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Possible Jobs</h3>
          {company.jobs && company.jobs.filter(job => job.isAvailable).length > 0 ? (
            <div className="space-y-5">
              {company.jobs
                .filter(job => job.isAvailable)
                .map((job, index) => {
                  const isDisabled = job.slots !== undefined && job.slots <= 0;
                  return (
                    <div
                      key={index}
                      onClick={() => !isDisabled && handleJobSelect(job)}
                      className={`p-4 border rounded-lg transition ${
                        !isDisabled
                          ? 'cursor-pointer hover:bg-gray-100' 
                          : 'cursor-not-allowed bg-gray-50 opacity-70'
                      }`}
                      title={isDisabled ? "This position is currently not hiring" : ""}
                    >
                      <h5 className="text-md font-medium text-gray-700">{job.position}</h5>
                      {isDisabled && (
                        <div className="flex items-center mt-1">
                          <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-sm text-red-500">Position filled</span>
                        </div>
                      )}
                      {!isDisabled && job.slots !== undefined && (
                        <span className="text-sm text-green-500 mt-1">
                          {job.slots} slot{job.slots !== 1 ? 's' : ''} available
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p>No Jobs Available in this company</p>
          )}
        </div>
      )}

      {step === 'apply' && selectedJob && (
        <CompanyApplicationApply
          job={selectedJob}
          company={company}
          setStep={setStep}
          setSelectedJob={setSelectedJob}
          hasApplied={hasApplied}
        />
      )}

      {step === 'requirement' && selectedJob && (
        <div className="text-black">
          <p className="text-[1.1rem] font-semibold text-center mt-4">Position: {selectedJob.position}</p>
          <br />
          <RequirementForm
            company={company}
            job={selectedJob}
            onSubmit={handleRequirementSubmit}
            onClose={() => setStep('apply')}
          />
        </div>
      )}

      <ApplicationStatusModal
        isOpen={showStatusModal}
        onClose={handleModalClose}
        status={applicationStatus}
        company={company}
        applicationId={selectedJob?.job_id || ''}
        job={selectedJob || { job_id: '', position: '', company_id: company.company_id }}
        onUpdateStatus={handleStatusUpdate}
      />

      <ApplicationInProgressModal isOpen={showInProgressModal} onClose={handleModalClose} />
    </div>
  );
};

export default CompanyApplication;