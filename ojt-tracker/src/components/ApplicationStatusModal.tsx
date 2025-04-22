import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'submitted' | 'approved' | 'rejected';
  companyName: string;
  onProceed?: () => void;
}

const ApplicationStatusModal: React.FC<ApplicationStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  companyName,
  onProceed
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

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
          buttonAction: onProceed
        };
      case 'rejected':
        return {
          title: 'Application Rejected',
          message: `We regret to inform you that your application to ${companyName} has been rejected.`,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-center mb-4">{content.title}</h2>
        <p className="text-gray-600 text-center mb-6">{content.message}</p>
        <div className="flex justify-center">
          <button
            onClick={content.buttonAction}
            className={`px-6 py-2 rounded-lg text-white font-semibold ${
              status === 'approved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : status === 'rejected'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {content.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatusModal; 