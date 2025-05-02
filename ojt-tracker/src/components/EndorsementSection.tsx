import React, { useState } from 'react';
import FileUploadField from './FileUploadField';
import { handleEndorsementSubmit as submitEndorsement } from '../services/uploadHandle/handleEndorsementSubmit';
import EndorsementButton from './EndorsementButton';
import Company from '../types/Company';
import Job from '../types/Job';

interface EndorsementSectionProps {
  company: Company;
  job: Job;
  onClose: () => void;
}

const EndorsementSection: React.FC<EndorsementSectionProps> = ({ company, job, onClose }) => {
  const [endorsement, setEndorsement] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showErrorPopup, setShowErrorPopup] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false); // Track submission status
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== 'application/pdf') {
        event.target.value = '';
        setErrorMessage('Please upload only PDF files for your endorsement letter.');
        setShowErrorPopup(true);
        return;
      }
      setEndorsement(file);
    }
  };
  
  const handleEndorsementSubmission = async () => {
    if (endorsement) {
      try {
        setLoading(true);
        await submitEndorsement(endorsement, company, () => {}, setLoading);
        setHasSubmitted(true);
        onClose();
      } catch (error) {
        console.error(error);
        setErrorMessage('Failed to submit endorsement letter. Please try again.');
        setShowErrorPopup(true);
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg mx-auto text-black">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Endorsement Submission</h2>
      <p className="text-base font-medium text-gray-700 mb-2">Position: {job.position}</p>
      
      <div className="flex flex-col items-center gap-4">
        {hasSubmitted && (
          <p className="text-sm text-gray-500 mb-4">
            You have already submitted for this position.
          </p>
        )}
        <EndorsementButton
          companyProps={{ company, onClose }}
          job={job}
        />
        <p>Filename Format: Surname_Endorsement_Letter</p>
        <FileUploadField
          key="endorsement"
          label="Endorsement Letter"
          fieldKey="endorsement"
          file={endorsement}
          onChange={handleFileChange}
        />
      </div>
      
      {showErrorPopup && (
        <p className="text-red-500 text-sm text-center mt-4">{errorMessage}</p>
      )}
      
      {endorsement && (
        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={handleEndorsementSubmission}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default EndorsementSection;