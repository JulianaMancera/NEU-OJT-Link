// FileUploadField.tsx
import React from "react";
import { Eye, File } from "lucide-react";

interface FileUploadFieldProps {
  file: File | null;
  fieldKey: string;
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
  fieldKey,
  onChange,
}) => {
  return (
       <>
                      <div className="mb-2 mt-2">
                        {renderFileIcon()}
                      </div>
                      <label className="bg-[#5fbff9] text-black rounded-md border border-gray-300 px-4 py-2 cursor-pointer text-sm">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => onChange(e, fieldKey)}
                          className="hidden"
                        />
                      </label>
                      <span className="text-gray-500 text-xs mt-1">
                        {file ? file.name : "No file chosen"}
                      </span>
                      {/* Preview Button */}
                      {file && (
                        <label
                          className="mt-2 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform duration-200"
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
