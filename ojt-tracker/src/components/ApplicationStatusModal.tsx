import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvailabilitySection from './AvailabilitySection';
import EndorsementSection from './EndorsementSection';
import { useClickOutside } from '../hooks/useClickOutside';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted';
  companyName: string;
  companyId: string;
  applicationId: string;
  job: {
    job_id: string;
    position: string;
  };
  onUpdateStatus?: (status: 'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted') => void;
}

const ApplicationStatusModal: React.FC<ApplicationStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  companyName,
  companyId,
  applicationId,
  job,
  onUpdateStatus
}) => {
  const navigate = useNavigate();
  const [showAvailability, setShowAvailability] = useState(false);
  const [showEndorsement, setShowEndorsement] = useState(false);
  
  const modalRef = useClickOutside(() => {
    if (isOpen) {
      onClose();
    }
  });
  
  if (!isOpen) return null;
  
  console.log(`Modal opened with status: ${status}`);
  
  const getStatusContent = () => {
    switch (status) {
      case 'submitted':
        return {
          title: 'Application Submitted',
          message: `Your application to ${companyName} has been submitted successfully. Please wait for the company's response.`,
          buttonText: 'Close',
          buttonAction: () => {
            onClose();
            navigate('/dashboard');
          }
        };
      case 'approved':
        return {
          title: 'Application Approved!',
          message: `Congratulations! Your application to ${companyName} has been approved. Please proceed with the next step.`,
          buttonText: 'Proceed',
          buttonAction: () => {
            setShowAvailability(true);
            if (onUpdateStatus) {
              onUpdateStatus('availability_submitted');
            }
          }
        };
      case 'availability_submitted':
        return {
          title: 'Availability Submitted!',
          message: `Your availability has been submitted successfully. Please proceed with the endorsement letter.`,
          buttonText: 'Proceed',
          buttonAction: () => {
            setShowEndorsement(true);
          }
        };
      case 'endorsement_submitted':
        return {
          title: 'Endorsement Submitted!',
          message: `Your endorsement letter has been submitted successfully. You may proceed to student dashboard`,
          buttonText: 'Close',
          buttonAction: () => {
            onClose();
            navigate('/dashboard');
          }
        };
      default:
        return {
          title: '',
          message: '',
          buttonText: '',
          buttonAction: () => {}
        };
    }
  };
  
  const content = getStatusContent();
  
  const handleAvailabilityCompletion = () => {
    if (onUpdateStatus) {
      onUpdateStatus('availability_submitted');
    }
    setShowAvailability(false);
    onClose();
  };

  const handleEndorsementCompletion = () => {
    setShowEndorsement(false);
    onClose();
  };

  if (showEndorsement) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <EndorsementSection 
            company={{
              company_id: companyId,
              name: companyName,
              address: '',
              email: '',
              contact_no: ''
            }}
            job={{
              job_id: job.job_id,
              company_id: companyId,
              created_at: new Date().toISOString(),
              position: job.position,
              description: '',
              responsibility: [],
              qualifications: [],
              work_hrs: '',
              schedule: ''
            }}
            onClose={handleEndorsementCompletion}
          />
        </div>
      </div>
    );
  }
  
  if (showAvailability) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh]">
          <AvailabilitySection
            applicationId={applicationId}
            company={{
              company_id: companyId,
              name: companyName,
              address: '',
              email: '',
              contact_no: ''
            }}
            job={job}
            onClose={handleAvailabilityCompletion}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-4">{content.title}</h2>
        <p className="text-gray-600 text-center mb-6">{content.message}</p>
        <div className="flex justify-center">
          <button
            onClick={content.buttonAction}
            className="px-6 py-2 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700"
          >
            {content.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatusModal;