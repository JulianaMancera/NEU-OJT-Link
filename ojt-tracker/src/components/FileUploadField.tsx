// FileUploadField.tsx
import React, { useState } from "react";
import { Eye, File } from "lucide-react";

interface FileUploadFieldProps {
  file: File | null;
  fieldKey: string;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, key: string) => void;
}
 // Function to render file icon 
  const renderFileIcon = () => (
    <File size={40} className="text-black-500" />
  );

  const previewFileIcon = () => (
    <Eye size={25} className="text-black-500" />
  );



const FileUploadField: React.FC<FileUploadFieldProps> = ({
  file,
  label,
  fieldKey,
  onChange,
}) => {
  const [isDragOver,setDragOver] = useState(false);
 // Create a synthetic change event for drop
 const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
  e.preventDefault();
  setDragOver(false);

  const droppedFiles = e.dataTransfer.files;
  if (droppedFiles.length > 0) {
    // Convert to synthetic change event
    const fakeInput = {
      target: {
        files: droppedFiles,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    onChange(fakeInput, fieldKey);
  }
};
  return (
         <>
      <div className="mb-2 mt-2 flex justify-center">{renderFileIcon()}</div>
      <div className="rounded-lg text-black border bg-gray-50 border-gray-300 px-4 py-2 w-full text-center  mb-2 font-bold">{label}</div>
      <label
        className={`bg-[#5fbff9] text-black rounded-md border border-dashed px-4 py-6 text-sm cursor-pointer transition-all duration-300
          ${isDragOver ? "border-blue-500 bg-blue-100" : "border-gray-300"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="block text-center">Upload PDF (Drag & Drop or Click)</span>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => onChange(e, fieldKey)}
          className="hidden"
        />
      </label>

      <span className="text-gray-500 text-xs mt-1 flex justify-center">
        {file ? file.name : "No file chosen"}
      </span>

      {file && (
        <label
          className="mt-2 inline-block cursor-pointer hover:scale-110 transition-transform duration-200"
          onClick={() => {
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, "_blank");
          }}
        >
          {previewFileIcon()}
        </label>
      )}
    </>        
  );
};

export default FileUploadField;

{/* <div className="flex items-center gap-2 mb-4">
      <File size={20} className="text-black-500" />
      <label className="font-bold min-w-[150px]">{label}</label>
      <label className="bg-[#5fbff9] text-black rounded-[15px] border border-black px-4 py-2 cursor-pointer">
        Choose File
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => onChange(e, fieldKey)}
          className="hidden"
        />
      </label>
      <span className="text-gray-500 pointer-events-none truncate max-w-[200px]">
        {file ? file.name : "No file chosen"}
      </span>
    </div>
*/}
