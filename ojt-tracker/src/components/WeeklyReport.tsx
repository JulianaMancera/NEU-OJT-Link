import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";

interface WeeklyReportProps {
  isOpen: boolean;
  onClose: () => void;
  editingReport?: {
    weekly_report_id: number;
    week_number: number;
  } | null;
}

const WeeklyReport = ({ isOpen, onClose, editingReport }: WeeklyReportProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setMessage("");
      setProgress(null);
    }
  }, [isOpen]);

  const resetMessage = () => setMessage("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    resetMessage();
  };

  const isValidFileName = (fileName: string): boolean => {
    return /^WeeklyReport_[a-zA-Z]+_Week(\d+)\.pdf$/.test(fileName);
  };

  const extractWeekNumber = (fileName: string): number | null => {
    const match = fileName.match(/Week(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("❌ Please select at least one file.");
      return;
    }
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("❌ You must be logged in.");
      return;
    }
  
    const userName = user.user_metadata.full_name || "Unknown User";
    setUploading(true);
    setProgress(0);
    let completed = 0;
    let errors: string[] = [];
  
    for (const file of files) {
      const fileName = file.name;

      if (file.type !== "application/pdf") {
        errors.push(`${fileName} is not a PDF.`);
        continue;
      }
  
      if (!isValidFileName(fileName)) {
        errors.push(`Invalid format: ${fileName}. Format should be WeeklyReport_Surname_Week#.pdf`);
        continue;
      }
  
      const extractedWeek = extractWeekNumber(fileName);
      if (extractedWeek === null) {
        errors.push(`Week number missing: ${fileName}`);
        continue;
      }
  
      if (editingReport && extractedWeek !== editingReport.week_number) {
        errors.push(`Week mismatch for ${fileName}`);
        continue;
      }
  
      const { data: existing, error: checkError } = await supabase
        .from("weekly_report")
        .select("weekly_report_id, week_number")
        .eq("submitted_by", userName)
        .eq("week_number", extractedWeek)
        .maybeSingle();
  
      if (checkError) {
        errors.push(`Database check failed: ${checkError.message}`);
        continue;
      }
  
      if (!editingReport && existing) {
        errors.push(`Week ${extractedWeek} already submitted. Skipping ${fileName}.`);
        continue;
      }
  
      try {
        const timestamped = `${Date.now()}_${fileName}`;
        const filePath = `weekly_reports/${timestamped}`;
  
        const { error: uploadError } = await supabase.storage
          .from("weekly_reports")
          .upload(filePath, file);
          
        if (uploadError) {
          errors.push(`Upload failed: ${uploadError.message}`);
          continue;
        }
  
        const { data: fileData } = supabase.storage
          .from("weekly_reports")
          .getPublicUrl(filePath);
  
        if (editingReport) {
          const { error: updateError } = await supabase
            .from("weekly_report")
            .update({
              file_name: file.name,
              file_url: fileData.publicUrl,
              uploaded_at: new Date().toISOString(),
              status: "pending"
            })
            .eq("weekly_report_id", editingReport.weekly_report_id);
            
          if (updateError) {
            errors.push(`Database update failed: ${updateError.message}`);
            continue;
          }
        } else {
          const { error: insertError } = await supabase
            .from("weekly_report")
            .insert([{
              file_name: file.name,
              file_url: fileData.publicUrl,
              uploaded_at: new Date().toISOString(),
              submitted_by: userName,
              start_date: new Date().toISOString(),
              user_id: user.id,
              week_number: extractedWeek,
            }]);
            
          if (insertError) {
            errors.push(`Database insert failed: ${insertError.message}`);
            continue;
          }
        }
  
        completed++;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push(`Unexpected error: ${errorMessage}`);
      }
      
      setProgress(Math.round((completed / files.length) * 100));
    }
  
    setUploading(false);
    
    if (errors.length > 0) {
      if (completed > 0) {
        setMessage(`✅ Uploaded ${completed} report(s) successfully with ${errors.length} errors.`);
      } else {
        setMessage(`❌ Upload failed. ${errors[0]}`);
      }
      console.error("Upload errors:", errors);
    } else {
      setMessage(`✅ Uploaded ${completed} report(s) successfully.`);
      setFiles([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="fixed inset-0" onClick={() => { onClose(); resetMessage(); }}></div>

      <div className="relative bg-gray-200 shadow-xl rounded-lg p-6 border-2 w-full max-w-2xl z-50">
        <h2 className="text-2xl font-semibold text-center mb-4">
          {editingReport ? `EDIT WEEK ${editingReport.week_number} REPORT` : "UPLOAD WEEKLY REPORT"}
        </h2>

        <label
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 bg-white p-6 rounded-lg cursor-pointer hover:bg-gray-300"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <FaCloudUploadAlt className="text-4xl text-gray-600 mb-2" />
          <p className="text-gray-600">
            Drag & drop files or <span className="text-blue-600 font-semibold">Browse</span>
          </p>
          <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
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
          <p className={`mt-4 text-center font-medium p-2 rounded ${message.includes("❌") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 text-white py-2 mt-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          disabled={uploading || files.length === 0}
        >
          {uploading ? "Uploading..." : editingReport ? "UPDATE REPORT" : "UPLOAD REPORT"}
        </button>
      </div>
    </div>
  );
};

export default WeeklyReport;