import React, { useState, ChangeEvent } from 'react';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({
    resume: null,
    coverLetter: null,
    com: null,
    cv: null,
    medCert: null,
    notarized: null,
    psyTest: null,
  });

  const fileFields = [
    { key: 'resume', label: 'Resume', required: true },
    { key: 'coverLetter', label: 'Cover Letter', required: true },
    { key: 'com', label: 'COM', required: true },
    { key: 'cv', label: 'Curriculum Vitae', required: true },
    { key: 'medCert', label: 'Medical Certificate', required: true },
    { key: 'notarized', label: 'Notarized Parent Consent', required: true },
    { key: 'psyTest', label: 'Psychological Test', required: true },
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = e.target.files?.[0] || null;
    if (file && !['application/pdf'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, [fieldKey]: 'Only PDF files are allowed' }));
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [fieldKey]: 'File size must be under 5MB' }));
      return;
    }
    setErrors((prev) => ({ ...prev, [fieldKey]: '' }));
    setFiles((prev) => ({ ...prev, [fieldKey]: file }));
  };

  const handleRequirementSubmit = async () => {
    setLoading(true);
    setErrors({});

    // Validate required files
    const newErrors: Record<string, string> = {};
    fileFields.forEach(({ key, required }) => {
      if (required && !files[key]) {
        newErrors[key] = 'This file is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const fileArray = Object.values(files).filter((file): file is File => file !== null);
      await onSubmit(fileArray);
      onClose();
    } catch (error) {
      console.error('RequirementForm: Error during submission:', error);
      setErrors({ general: 'Error submitting requirements. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#3657DB] from-24% to-[#8D95B5] to-98% bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-labelledby="modal-title">
      <div className="bg-white rounded-lg shadow-xl p-9 w-full max-w-4xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 id="modal-title" className="text-2xl font-semibold">
            Application for{' '}
            <span className="text-3xl font-bold text-blue-600">{job.position}</span>{' '}
            at {company.name}
          </h2>
          <p className="text-gray-600 mt-2 text-[1.1rem]">Please upload the required documents below</p>
          <p className='text-semibold mt-2'>Filename Format Example: Surname_Resume</p>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex justify-between items-center">
            <span>{errors.general}</span>
            <button
              onClick={() => setErrors({})}
              className="text-red-700 hover:text-red-900"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable File Upload Fields */}
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {fileFields.map(({ key, label, required }) => (
              <div key={key} className="space-y-2">
                <FileUploadField
                  label={label}
                  fieldKey={key}
                  file={files[key]}
                  onChange={handleFileChange}
                  error={errors[key]}
                  required={required}
                  disabled={loading}
                />
              </div>
            ))}
          </div>
        </div>

       {/* Actions */}
          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={handleRequirementSubmit}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              aria-label="Submit application"
            >
              {loading ? <Loading /> : 'Submit'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              aria-label="Cancel application"
            >
              Cancel
            </button>
          </div>
      </div>
    </div>
  );
};

export default RequirementForm;