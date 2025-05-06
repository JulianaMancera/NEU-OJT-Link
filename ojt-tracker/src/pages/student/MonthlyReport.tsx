import { useState, useEffect } from "react";
import { supabase } from "../../../supabase";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";

interface MonthlyReportProps {
  isOpen: boolean;
  onClose: () => void;
}

const MonthlyReport = ({ isOpen, onClose }: MonthlyReportProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [weeklyReportCount, setWeeklyReportCount] = useState<number | null>(null);

  // 🔍 Check weekly report count on open
  useEffect(() => {
    const fetchWeeklyReportCount = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user || userError) {
        setMessage("❌ You must be logged in.");
        setWeeklyReportCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("weekly_report")
        .select("*", { count: "exact" })
        .eq("user_id", user.id); 

      if (error) {
        setWeeklyReportCount(0);
      } else {
        setWeeklyReportCount(count || 0);

      }
    };

    if (isOpen) {
      fetchWeeklyReportCount();
    }
  }, [isOpen]);

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

  const handleUpload = async () => {
    const user = await supabase.auth.getUser();
    const userID = user.data.user?.id;
    if (files.length === 0) {
      setMessage("❌ Please select a file.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${userID}_${Date.now()}_${file.name}`;
      const filePath = `monthly_reports/${fileName}`;

      const { error } = await supabase.storage.from("monthly-reports").upload(filePath, file);
      if (error) {
        setMessage(`❌ Error uploading: ${error.message}`);
        setUploading(false);
        return;
      }

      const { data: fileData } = supabase.storage.from("monthly-reports").getPublicUrl(filePath);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("❌ You must be logged in to upload.");
        setUploading(false);
        return;
      }

      const currentMonth = new Date().getMonth() + 1;
      const userName = user.user_metadata.full_name || "Unknown User";

      const { error: insertError } = await supabase.from("monthly_report").insert([
        
        {
          file_name: file.name,
          file_url: fileData.publicUrl,
          uploaded_at: new Date().toISOString(),
          submitted_by: userName,
          month: currentMonth
        },
      ]);

      if (insertError) {
        setMessage(`❌ Database error: ${insertError.message}`);
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    setUploading(false);
    setFiles([]);
    setMessage("✅ File uploaded successfully!");
  };

  if (!isOpen) return null;

  const weeklyLimit = 4; // Change to 4 if needed
  const isEligible = weeklyReportCount !== null && weeklyReportCount >= weeklyLimit;

  return (
    <div className={`fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center ${isOpen ? "visible" : "invisible"}`}>
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative bg-gray-200 shadow-xl rounded-lg p-6 border-2 border-black-400 w-full max-w-2xl z-50">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">UPLOAD MONTHLY REPORT</h2>

        {!isEligible ? (
          <p className="text-red-600 text-center font-semibold bg-red-100 p-4 rounded">
          ❌ You must upload at least {weeklyLimit} weekly reports before submitting a monthly report.<br />
          📌 You still need to upload <span className="font-bold">{weeklyLimit - (weeklyReportCount || 0)}</span> weekly report{weeklyLimit - (weeklyReportCount || 0) === 1 ? "" : "s"}.
        </p>
        ) : (
          <>
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

            {uploading && progress !== null && (
              <div className="mt-4">
                <p className="text-sm text-gray-700">Uploading... {Math.round(progress)}%</p>
                <div className="w-full bg-gray-300 h-2 rounded">
                  <div className="bg-blue-600 h-2 rounded" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

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

            {message && (
              <p
                className={`mt-4 text-center font-medium p-2 rounded ${
                  message.includes("❌") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleUpload}
              className="w-full bg-blue-600 text-white py-2 mt-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-400"
              disabled={uploading || files.length === 0}
            >
              {uploading ? "Uploading..." : "UPLOAD FILES"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlyReport;
