import React from 'react';

interface ApplicationInProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApplicationInProgressModal: React.FC<ApplicationInProgressModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Application In Progress</h2>
        <p className="text-gray-600 mb-6">
          Your application is in progress. Please wait for the company's approval. You will be notified once you are accepted.
        </p>
        <button
          onClick={onClose}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ApplicationInProgressModal;