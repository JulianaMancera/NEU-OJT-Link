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
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
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
    { key: 'resume', label: 'Resume' },
    { key: 'coverLetter', label: 'Cover Letter' },
    { key: 'com', label: 'COM' },
    { key: 'cv', label: 'CV' },
    { key: 'medCert', label: 'Medical Certificate' },
    { key: 'notarized', label: 'Notarized Parent Consent' },
    { key: 'psyTest', label: 'Psychological Test' },
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({
      ...prev,
      [fieldKey]: file,
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
      console.log('RequirementForm: Submitting files:', files);
      const fileArray = Object.values(files).filter((file): file is File => file !== null);
      onSubmit(fileArray);
    } catch (error) {
      console.error('RequirementForm: Error during submission:', error);
      setErrorMessage('Error submitting requirements. Please try again.');
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-black rounded-lg p-10 w-full max-w-[1000px] mx-auto">
      <p className="font-semibold text-center text-[1.2rem] mb-4">
        Application for {job.position} at {company.name}
      </p>
      <p className="font-semibold text-center text-[1.2rem] mb-8">Please Submit Requirements</p>

      {showErrorPopup && (
        <div className="text-red-500 text-center mb-4">{errorMessage}</div>
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