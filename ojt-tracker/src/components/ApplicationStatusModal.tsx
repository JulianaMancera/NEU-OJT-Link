import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvailabilitySection from './AvailabilitySection';
import EndorsementSection from './EndorsementSection';
import EndorsementSuccessModal from './EndorsementSuccessModal';
import { useClickOutside } from '../hooks/useClickOutside';
import Company from '../types/Company';
import Job from '../types/Job';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted' | 'rejected';
  company?: Company;
  applicationId?: string;
  job?: Job;
  onUpdateStatus?: (status: 'submitted' | 'approved' | 'availability_submitted' | 'endorsement_submitted' | 'rejected') => void;
  userName?: string;
  rejectedCompanies?: Company[];
}

const ApplicationStatusModal: React.FC<ApplicationStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  company,
  applicationId = "",
  job,
  onUpdateStatus,
  userName = "",
  rejectedCompanies = []
}) => {
  const navigate = useNavigate();
  const [showAvailability, setShowAvailability] = useState(false);
  const [showEndorsement, setShowEndorsement] = useState(false);
  const [showEndorsementSuccess, setShowEndorsementSuccess] = useState(status === 'endorsement_submitted');
  
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
          message: `Your application to ${company?.name || 'the company'} has been submitted successfully. Please wait for the company's response.`,
          buttonText: 'Close',
          buttonAction: () => {
            onClose();
            navigate('/dashboard');
          }
        };
      case 'approved':
        return {
          title: `Application Approved!`,
          message: `Congratulations! Your application to ${company?.name || 'the company'} has been approved. Please proceed with the next step.`,
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
          title: `Availability Submitted!`,
          message: `Your availability has been submitted successfully. Please proceed with the endorsement letter.`,
          buttonText: 'Proceed',
          buttonAction: () => {
            setShowEndorsement(true);
          }
        };
      case 'endorsement_submitted':
        return {
          title: `Endorsement Submitted!`,
          message: `Your endorsement letter has been submitted successfully. You may proceed to student dashboard`,
          buttonText: 'Close',
          buttonAction: () => {
            setShowEndorsementSuccess(true);
          }
        };
      case 'rejected':
        let displayText = '';
        
        if (rejectedCompanies && rejectedCompanies.length > 0) {
          if (rejectedCompanies.length === 1) {
            displayText = rejectedCompanies[0].name;
          } else {
            const companyNames = rejectedCompanies.map(c => c.name);
            const lastCompany = companyNames.pop();
            displayText = `${companyNames.join(', ')} and ${lastCompany}`;
          }
        } else {
          displayText = company?.name || 'the company';
        }
          
        return {
          title: `Application${rejectedCompanies && rejectedCompanies.length > 1 ? 's' : ''} Rejected`,
          message: `We regret to inform you that your application${rejectedCompanies && rejectedCompanies.length > 1 ? 's' : ''} to ${displayText} ${rejectedCompanies && rejectedCompanies.length > 1 ? 'have' : 'has'} been rejected. You may apply to other available jobs.`,
          buttonText: 'Return to Dashboard',
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
    if (onUpdateStatus) {
      onUpdateStatus('endorsement_submitted');
    }
    setShowEndorsement(false);
    setShowEndorsementSuccess(true);
  };

  const handleEndorsementSuccessClose = () => {
    setShowEndorsementSuccess(false);
    onClose();
    navigate('/dashboard');
  };

  if (showEndorsementSuccess) {
    return (
      <EndorsementSuccessModal
        isOpen={true}
        onClose={handleEndorsementSuccessClose}
        userName={userName}
      />
    );
  }

  if (showEndorsement && company && job) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#3657DB] from-24% to-[#8D95B5] to-98% flex items-center justify-center z-50">
        <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4">
          <EndorsementSection 
            company={company}
            job={job}
            onClose={handleEndorsementCompletion}
          />
        </div>
      </div>
    );
  }
  
  if (showAvailability && company && job) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#3657DB] from-24% to-[#8D95B5] to-98% flex items-center justify-center z-50">
        <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 overflow-y-auto max-h-[90vh]">
          <AvailabilitySection
            applicationId={applicationId}
            company={company}
            job={job}
            onClose={handleAvailabilityCompletion}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#3657DB] from-24% to-[#8D95B5] to-98% flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-xl w-full mx-4">
      <h2 className="text-2xl font-bold text-center mb-4 text-blue-600 !text-black">{content.title}</h2>
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