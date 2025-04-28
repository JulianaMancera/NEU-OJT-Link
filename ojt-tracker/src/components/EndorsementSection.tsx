import React, { useState } from 'react';
import FileUploadField from './FileUploadField';
import { handleEndorsementSubmit as submitEndorsement } from '../services/uploadHandle/handleEndorsementSubmit';
import EndorsementButton from './EndorsementButton';
import Company from '../types/Company';
import Job from '../types/Job';
import EndorsementSuccessModal from './EndorsementSuccessModal';

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
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

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
        setShowSuccessModal(true);
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
    <div className="text-black">
      <p className="text-[1rem] font-semibold">Position: {job.position}</p>
      <br />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '18px', flexDirection: 'column' }}>
        <p>You already submitted for this position</p>
        <EndorsementButton 
          companyProps={{ company, onClose }}
          job={job}
        />
        <FileUploadField
          key="endorsement"
          label="Endorsement Letter"
          fieldKey="endorsement"
          file={endorsement}
          onChange={handleFileChange}
        />
      </div>
      {showErrorPopup && <p className="text-red-500">{errorMessage}</p>}
      {endorsement && (
        <div className="flex gap-4 mt-8 justify-center">
          <button 
            onClick={handleEndorsementSubmission} 
            className="text-white bg-black px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button 
            onClick={onClose} 
            className="text-white bg-gray-500 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      )}
      <EndorsementSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
      />
    </div>
  );
};

export default EndorsementSection; 