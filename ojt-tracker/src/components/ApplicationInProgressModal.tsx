import React from 'react';

interface ApplicationInProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApplicationInProgressModal: React.FC<ApplicationInProgressModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#3657DB] from-24% to-[#8D95B5] to-98% bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-10 max-w-md w-full mx-4 text-center shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Application In Progress</h2>
        <p className="text-gray-600 text-base mb-7 leading-relaxed">
          Your application is in progress. Please wait for the company's approval. You will be notified once you are accepted.
        </p>
        <button
          onClick={onClose}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="Close modal"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ApplicationInProgressModal;