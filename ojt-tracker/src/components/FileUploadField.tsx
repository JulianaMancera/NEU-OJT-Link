import React, { useState } from "react";
import { Eye, File } from "lucide-react";

interface FileUploadFieldProps {
  file: File | null;
  fieldKey: string;
  label: string; // e.g. "Endorsement Letter"
  onChange: (e: React.ChangeEvent<HTMLInputElement>, key: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const renderFileIcon = () => <File size={40} className="text-gray-500" />;
const previewFileIcon = () => <Eye size={25} className="text-gray-500" />;

/**
 * Converts label like "Endorsement Letter" to "Endorsement_Letter"
 */
const formatLabelForValidation = (label: string) => {
  return label.trim().replace(/\s+/g, "_");
};

/**
 * Validates filename matches "Surname_Label.pdf"
 */
const validateFileName = (fileName: string, label: string) => {
  const formattedLabel = formatLabelForValidation(label);
  const regex = new RegExp(`^[A-Za-z]+_${formattedLabel}\\.pdf$`, "i");
  return regex.test(fileName);
};

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  file,
  label,
  fieldKey,
  onChange,
  error,
  required,
  disabled,
}) => {
  const [isDragOver, setDragOver] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFileValidation = (fileInput: File) => {
    if (!validateFileName(fileInput.name, label)) {
      setShowModal(true);
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && handleFileValidation(droppedFile)) {
      const fakeInput = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(fakeInput, fieldKey);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && handleFileValidation(selectedFile)) {
      onChange(e, fieldKey);
    }
  };

  return (
    <div className="flex flex-col items-center relative">
      {/* Label */}
      <div className="rounded-lg text-black border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold truncate">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </div>

      {/* File Icon */}
      <div className="mb-2 mt-2 flex justify-center">{renderFileIcon()}</div>

      {/* Upload Area */}
      <label
        className={`bg-[#5fbff9] text-black rounded-md border border-dashed px-4 py-5 text-sm transition-all duration-300 block w-full text-center
          ${isDragOver && !disabled ? "border-blue-500 bg-blue-200" : error ? "border-red-500 bg-red-50" : "border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="block text-center">
          Upload PDF (Drag & Drop or Click)
        </span>
        <input
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          aria-describedby={error ? `${fieldKey}-error` : undefined}
          required={required}
        />
      </label>

      {/* File name or error */}
      <div className="mt-1 flex justify-center mb-4 min-h-[1.5rem]">
        {error ? (
          <span
            className="text-red-500 text-xs"
            id={`${fieldKey}-error`}
            role="alert"
          >
            {error}
          </span>
        ) : (
          <span className="text-gray-500 text-xs">
            {file ? file.name : "No file chosen"}
          </span>
        )}
      </div>

      {/* Eye icon preview */}
      {file && !error && (
        <div className="flex justify-center w-full mt-2">
          <button
            type="button"
            className="cursor-pointer hover:scale-110 transition-transform duration-200 disabled:opacity-50"
            onClick={() => {
              const fileURL = URL.createObjectURL(file);
              window.open(fileURL, "_blank");
            }}
            disabled={disabled}
            aria-label={`Preview ${file.name}`}
          >
            {previewFileIcon()}
          </button>
        </div>
      )}

      {/* Modal for invalid file format */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              Invalid File Name
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              The file name format is not supported.
              <br />
              <strong>Format:</strong>{" "}
              <code>Surname_{formatLabelForValidation(label)}.pdf</code>
            </p>
            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => setShowModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
