import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';

interface EndorsementSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EndorsementSuccessModal: React.FC<EndorsementSuccessModalProps> = ({
  isOpen,
  onClose,
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
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Endorsement Letter Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your endorsement letter has been successfully submitted. You can now proceed to your student dashboard to track your application status and manage your OJT journey.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleProceedToDashboard}
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
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