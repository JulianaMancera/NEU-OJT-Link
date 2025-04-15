// FileUploadField.tsx
import React from "react";
import { File } from "lucide-react";

interface FileUploadFieldProps {
  label: string;
  file: File | null;
  fieldKey: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, key: string) => void;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  file,
  fieldKey,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4">
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
  );
};

export default FileUploadField;
