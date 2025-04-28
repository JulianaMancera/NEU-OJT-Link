import React, { useState, ChangeEvent } from 'react';
import { supabase } from '../../supabase';
import FileUploadField from './FileUploadField';
import { Loading } from './Loading';
import { Job } from '../types/Job';
import { Company } from '../types/Company';

interface RequirementFormProps {
  company: Company;
  job: Job;
  onSubmit: (files: File[]) => void;
  onClose: () => void;
}

const RequirementForm: React.FC<RequirementFormProps> = ({ company, job, onSubmit, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({
    resume: null,
    coverLetter: null,
    com: null,
    cv: null,
    medCert: null,
    notarized: null,
    psyTest: null
  });

  const fileFields = [
    { key: 'resume', label: 'Resume' },
    { key: 'coverLetter', label: 'Cover Letter' },
    { key: 'com', label: 'COM' },
    { key: 'cv', label: 'CV' },
    { key: 'medCert', label: 'Medical Certificate' },
    { key: 'notarized', label: 'Notarized Parent Consent' },
    { key: 'psyTest', label: 'Psychological Test' }
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = e.target.files?.[0] || null;
    setFiles(prev => ({
      ...prev,
      [fieldKey]: file
    }));
  };

  const handleRequirementSubmit = async () => {
    setLoading(true);
    setShowErrorPopup(false);

    // Check if all files are uploaded
    const missingFiles = fileFields.filter(({ key }) => !files[key]);
    if (missingFiles.length > 0) {
      setErrorMessage('Please upload all required files');
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    try {
      console.log('Starting requirement submission process...');
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }
      console.log('User authenticated:', user.data.user.id);

      // First, check if user already has an application for this job
      console.log('Checking for existing application...');
      console.log('Job ID:', job.job_id);
      console.log('User ID:', user.data.user.id);
      
      const { data: existingApplication, error: checkError } = await supabase
        .from('application')
        .select('*')
        .eq('user_id', user.data.user.id)
        .eq('job_id', job.job_id)
        .single();

      if (checkError) {
        console.error('Error checking for existing application:', checkError);
      }
      console.log('Existing application check result:', existingApplication);

      if (existingApplication) {
        console.error('Duplicate application found:', existingApplication);
        throw new Error('You have already applied to this job');
      }

      // Generate a unique identifier for this submission
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const uniqueId = `${timestamp}_${randomString}`;

      // Upload all files
      console.log('Starting file uploads...');
      const uploadPromises = fileFields.map(async ({ key }) => {
        const file = files[key];
        if (!file) return null;

        // Get file extension
        const fileExtension = file.name.split('.').pop();
        // Create unique filename
        const uniqueFilename = `${key}_${user.data.user?.id}_${company.company_id}_${uniqueId}.${fileExtension}`;
        const filePath = `${key}/${uniqueFilename}`;
        
        console.log(`Uploading file: ${filePath}`);
        
        const { data, error } = await supabase.storage
          .from('applicant-documents')
          .upload(filePath, file);

        if (error) {
          console.error(`Error uploading ${key}:`, error);
          throw error;
        }
        console.log(`Successfully uploaded ${key}:`, data?.path);
        return data?.path;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', uploadedPaths);

      // Create application record first
      console.log('Creating application record...');
      const { data: applicationData, error: applicationError } = await supabase
        .from('application')
        .insert([{
          user_id: user.data.user.id,
          company_id: company.company_id,
          email: user.data.user.email,
          job_id: job.job_id,
          status: 'pending',
          start_date: null,
          end_date: null
        }])
        .select()
        .single();

      if (applicationError) {
        console.error('Error creating application:', applicationError);
        throw new Error('Failed to create application');
      }
      console.log('Application created successfully:', applicationData);

      // Then create requirements record
      console.log('Creating requirements record...');
      console.log('Student ID:', user.data.user.id);
      console.log('Company ID:', company.company_id);
      console.log('Job ID:', job.job_id);
      
      const { error: requirementsError } = await supabase.from('requirements').insert([{
        student_id: user.data.user.id,
        created_at: new Date().toISOString(),
        resume_url: uploadedPaths[0],
        cover_letter_url: uploadedPaths[1],
        com_url: uploadedPaths[2],
        cv_url: uploadedPaths[3],
        medCert_url: uploadedPaths[4],
        notarize_url: uploadedPaths[5],
        psyTest_url: uploadedPaths[6],
        company_id: company.company_id,
        job_id: job.job_id
      }]);

      if (requirementsError) {
        console.error('Error creating requirements:', requirementsError);
        // If requirements creation fails, delete the application
        console.log('Deleting application due to requirements error...');
        await supabase
          .from('application')
          .delete()
          .eq('application_id', applicationData.application_id);
        throw new Error('Failed to create requirements');
      }
      console.log('Requirements created successfully');

      onSubmit(Object.values(files).filter(Boolean) as File[]);
    } catch (error) {
      console.error('Error in requirement submission process:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error submitting requirements. Please try again.');
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-black rounded-lg p-10 w-full max-w-[1000px] mx-auto">
      <p className="font-semibold text-center text-[1.2rem] mb-8">Please Submit Requirements</p>
      
      {showErrorPopup && (
        <div className="text-red-500 text-center mb-4">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fileFields.map(({ key, label }) => (
          <div key={key}>
            <FileUploadField
              label={label}
              fieldKey={key}
              file={files[key]}
              onChange={handleFileChange}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-8 justify-center">
        <button
          onClick={handleRequirementSubmit}
          disabled={loading}
          className="text-white bg-black px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? <Loading /> : 'Submit'}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="text-white bg-black px-4 py-2 rounded disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RequirementForm; 