import React, { useState } from "react";
import { Eye, File } from "lucide-react";

interface FileUploadFieldProps {
  file: File | null;
  fieldKey: string;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, key: string) => void;
  error?: string; // Added error prop
  required?: boolean; // Added required prop
  disabled?: boolean; // Added disabled prop
}

// Function to render file icon
const renderFileIcon = () => <File size={40} className="text-gray-500" />;

// Function to render preview icon
const previewFileIcon = () => <Eye size={25} className="text-gray-500" />;

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

  // Handle drag-and-drop
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const fakeInput = {
        target: { files: droppedFiles },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(fakeInput, fieldKey);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Label with required indicator */}
      <div className="rounded-lg text-black border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center mb-2 font-bold truncate">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </div>

      {/* File Icon */}
      <div className="mb-2 mt-2 flex justify-center">{renderFileIcon()}</div>

      {/* File Upload Area */}
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
          onChange={(e) => onChange(e, fieldKey)}
          className="hidden"
          disabled={disabled}
          aria-describedby={error ? `${fieldKey}-error` : undefined}
          required={required}
        />
      </label>

      {/* File Name or Error Message */}
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

      {/* Preview Icon */}
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
    </div>
  );
};

export default FileUploadField;