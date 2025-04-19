import { useState } from "react";
import { supabase } from "../../supabase";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";

interface WeeklyReportProps {
  isOpen: boolean;
  onClose: () => void;
}

const WeeklyReport = ({ isOpen, onClose }: WeeklyReportProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  // Handle file selection and drag-drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Handle file upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("❌ Please select a file.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `weekly_reports/${fileName}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage.from("weekly_reports").upload(filePath, file);
      if (error) {
        setMessage(`❌ Error uploading: ${error.message}`);
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: fileData } = supabase.storage.from("weekly_reports").getPublicUrl(filePath);

      // Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("❌ You must be logged in to upload.");
        setUploading(false);
        return;
      }

      // Get user metadata
      const userName = user.user_metadata.full_name || "Unknown User";

      // Save file info to database
      const { error: insertError } = await supabase.from("weekly_report").insert([
        {
          file_name: file.name,
          file_url: fileData.publicUrl,
          uploaded_at: new Date().toISOString(),
          submitted_by: userName,
          start_date: new Date().toISOString(),
          user_id: user.id,
        },
      ]);

      if (insertError) {
        setMessage(`❌ Database error: ${insertError.message}`);
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    setUploading(false);
    setFiles([]); // Clear file list
    setMessage("✅ File uploaded successfully!");
  };

  return (
    <div className={`fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center ${isOpen ? "visible" : "invisible"}`}>
      {/* Blurred Background */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-gray-200 shadow-xl rounded-lg p-6 border-2 border-black-400 w-full max-w-2xl z-50">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">UPLOAD WEEKLY REPORT</h2>

        {/* Drag & Drop Area */}
        <label
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 bg-white p-6 rounded-lg cursor-pointer hover:bg-gray-300"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <FaCloudUploadAlt className="text-4xl text-gray-600 mb-2" />
          <p className="text-gray-600">
            Drag & drop files or <span className="text-blue-600 font-semibold">Browse</span>
          </p>
          <input type="file" accept="application/pdf" multiple onChange={handleFileChange} className="hidden" />
        </label>

        {/* Upload Progress */}
        {uploading && progress !== null && (
          <div className="mt-4">
            <p className="text-sm text-gray-700">Uploading... {Math.round(progress)}%</p>
            <div className="w-full bg-gray-300 h-2 rounded">
              <div className="bg-blue-600 h-2 rounded" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-gray-700 font-medium mb-2">Uploaded</h3>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 border rounded mb-2">
                <span className="text-gray-700 truncate">{file.name}</span>
                <button onClick={() => removeFile(index)} className="text-red-600 hover:text-red-800">
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Message Display */}
        {message && (
          <p
            className={`mt-4 text-center font-medium p-2 rounded ${
              message.includes("❌") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 text-white py-2 mt-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-400"
          disabled={uploading || files.length === 0}
        >
          {uploading ? "Uploading..." : "UPLOAD FILES"}
        </button>
      </div>
    </div>
  );
};

export default WeeklyReport;
