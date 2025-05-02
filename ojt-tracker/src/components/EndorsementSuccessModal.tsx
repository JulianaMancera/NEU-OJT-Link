import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';

interface EndorsementSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

const EndorsementSuccessModal: React.FC<EndorsementSuccessModalProps> = ({
  isOpen,
  onClose,
  userName,
}) => {
  const navigate = useNavigate();
  const modalRef = useClickOutside(() => {
    if (isOpen) {
      onClose();
    }
  });

  if (!isOpen) return null;

  const handleProceedToDashboard = () => {
    onClose();
    navigate('/student-dashboard');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#3657DB] from-24% to-[#8D95B5] to-98% bg-opacity-75 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Success, {userName}!</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Your endorsement letter has been successfully submitted. Head to your dashboard to track your application and continue your OJT journey.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleProceedToDashboard}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndorsementSuccessModal;