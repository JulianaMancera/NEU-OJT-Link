import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types/Job';
import { Company } from '../types/Company';
import CompanyApplicationApply from './CompanyApplicationApply';
import RequirementForm from './RequirementForm';
import ApplicationStatusModal from './ApplicationStatusModal';
import { Loading } from './Loading';
import { supabase } from '../../supabase';

interface CompanyApplicationProps {
  company: Company;
  onClose: () => void;
  hasApprovedApplication?: boolean;
  applicationId?: string | null;
  initialStep?: 'selectJob' | 'apply' | 'requirement' | 'dashboard';
}


const CompanyApplication: React.FC<CompanyApplicationProps> = ({ 
  company, 
  onClose,
  initialStep = 'selectJob'
}) => {

  const navigate = useNavigate();
  const [step, setStep] = useState<'selectJob' | 'apply' | 'requirement' | 'dashboard'>(initialStep);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted'>('submitted');
  const [loading, setLoading] = useState(false);
  const [userApplications, setUserApplications] = useState<{job_id: string, status: string}[]>([]);

  useEffect(() => {
    const fetchUserApplications = async () => {
      try {
        setLoading(true); // Start loading
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        const { data: applications, error } = await supabase
          .from('application')
          .select('job_id, status')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user applications:', error);
          return;
        }

        setUserApplications(applications || []);
      } catch (error) {
        console.error('Error in fetchUserApplications:', error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchUserApplications();
  }, []);

  const handleJobSelect = (job: Job) => {
    try {
      const existingApplication = userApplications.find(app => app.job_id === job.job_id);
      
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
    try {
      setLoading(true); // Start loading
      console.log('Submitting requirements...');

      // Upload files to Supabase Storage
      const uploadPromises = files.map(async (file, index) => {
        const { data, error } = await supabase.storage
          .from('application-files') // Replace with your bucket name
          .upload(`user-files/${Date.now()}-${index}-${file.name}`, file);
        if (error) {
          throw new Error(`File upload failed: ${error.message}`);
        }
        return data?.path;
      });

      const filePaths = await Promise.all(uploadPromises);
      console.log('Uploaded files:', filePaths);

      // Save application data to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedJob) {
        throw new Error('User or selected job not found');
      }

      const { error: insertError } = await supabase
        .from('application')
        .insert({
          user_id: user.id,
          job_id: selectedJob.job_id,
          company_id: company.company_id,
          status: 'submitted',
          files: filePaths, // Store file paths in the database
        });

      if (insertError) {
        throw new Error(`Failed to save application: ${insertError.message}`);
      }

      setApplicationStatus('submitted');
      setShowStatusModal(true);
      setStep('dashboard');
      
      // Update localStorage
      console.log('Updating localStorage with application data...');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedApplications = [...(userData.applications || []), {
        company_id: company.company_id,
        job_id: selectedJob?.job_id,
        status: 'submitted',
        date: new Date().toISOString()
      }];
      
      localStorage.setItem('userData', JSON.stringify({
        ...userData,
        applications: updatedApplications
      }));
      console.log('Successfully updated localStorage');
    } catch (error: unknown) {
      // Type error as Error for safe handling, as discussed previously
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in handleRequirementSubmit:', errorMessage);
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleModalClose = () => {
    setShowStatusModal(false);
    onClose();
    navigate('/dashboard');
  };

  const handleStatusUpdate = (status: 'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted') => {
    setApplicationStatus(status);
  };

  return (
    <div className="flex items-center justify-center">
      {loading && <Loading />}
      {step === "selectJob" && (
        <div className="text-black">
          <br />
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Possible Jobs</h3>
          {company.jobs && company.jobs.length > 0 ? (
            <div className="space-y-5">
              {company.jobs.map((job, index) => (
                <div
                  key={index}
                  onClick={() => handleJobSelect(job)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition"
                >
                  <h5 className="text-md font-medium text-gray-700">{job.position}</h5>
                </div>
              ))}
            </div>
          ) : (
            <p>No Jobs Available in this company</p>
          )}
        </div>
      )}

      {step === "apply" && selectedJob && (
        <CompanyApplicationApply 
          job={selectedJob} 
          company={company} 
          setStep={setStep} 
          setSelectedJob={setSelectedJob} 
        />
      )}

      {step === "requirement" && selectedJob && (
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
        companyName={company.name}
        companyId={company.company_id}
        applicationId={selectedJob?.job_id || ''}
        job={{
          job_id: selectedJob?.job_id || '',
          position: selectedJob?.position || ''
        }}
        onUpdateStatus={handleStatusUpdate}
      />
    </div>
  );
};

export default CompanyApplication;