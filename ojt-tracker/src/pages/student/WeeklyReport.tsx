import { useState, useEffect } from "react";
import { supabase } from "../../../supabase";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";
import { extractTableFromPdf } from "../../services/pdfExtractor";

interface WeeklyReportProps {
  isOpen: boolean;
  onClose: () => void;
  editingReport?: {
    weekly_report_id: number;
    week_number: number;
  } | null;
}

interface TimeEntry {
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  task: string;
  remarks: string;
}

const WeeklyReport = ({ isOpen, onClose, editingReport }: WeeklyReportProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [extractedEntries, setExtractedEntries] = useState<TimeEntry[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [totalHours, setTotalHours] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setMessage("");
      setProgress(null);
      setExtractedEntries([]);
      setTotalHours(0);
    }
  }, [isOpen]);

  const resetMessage = () => setMessage("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Extract table data from the first PDF
      if (selectedFiles.length > 0 && selectedFiles[0].type === "application/pdf") {
        await extractPDF(selectedFiles[0]);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    
    // Extract table data from the first PDF
    if (droppedFiles.length > 0 && droppedFiles[0].type === "application/pdf") {
      await extractPDF(droppedFiles[0]);
    }
  };
  const extractPDF = async (file: File) => {
    setIsExtracting(true);
    setMessage("🔍 Extracting table data from PDF...");
    try {
      const { entries, totalHours } = await extractTableFromPdf(file);
      setExtractedEntries(entries);
      setTotalHours(totalHours);
      setMessage(`✅ Found ${entries.length} time entries in the PDF. Total hours: ${totalHours}`);
    } catch (error) {
      console.error("Error extracting table from PDF:", error);
      setMessage("❌ Failed to extract table data from PDF.");
    } finally {
      setIsExtracting(false);
    }
  };
  
 const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    resetMessage();
    setExtractedEntries([]);
    setTotalHours(0);
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
    const errors: string[] = [];
  
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
        const time = new Date();
        const filePath = `weekly_reports/${user.id}_WeeklyReport_${time}`;
  
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
  
        let reportId: number;
  
        if (editingReport) {
          const { error: updateError } = await supabase
            .from("weekly_report")
            .update({
              file_name: file.name,
              file_url: fileData.publicUrl,
              uploaded_at: new Date().toISOString(),
              status: "pending",
              total_hours: totalHours
            })
            .eq("weekly_report_id", editingReport.weekly_report_id);
            
          if (updateError) {
            errors.push(`Database update failed: ${updateError.message}`);
            continue;
          }
          
          reportId = editingReport.weekly_report_id;
        } else {
          const { data: insertedReport, error: insertError } = await supabase
            .from("weekly_report")
            .insert([{
              file_name: file.name,
              file_url: fileData.publicUrl,
              uploaded_at: new Date().toISOString(),
              submitted_by: userName,
              start_date: new Date().toISOString(),
              user_id: user.id,
              week_number: extractedWeek,
              total_hours: totalHours,
            }])
            .select("weekly_report_id")
            .single();
            
          if (insertError || !insertedReport) {
            errors.push(`Database insert failed: ${insertError?.message || "Unknown error"}`);
            continue;
          }
          
          reportId = insertedReport.weekly_report_id;
        }
  
        // Insert time entries from the extracted table data
        if (extractedEntries.length > 0) {
          // First, delete any existing time entries for this report if editing
          if (editingReport) {
            const { error: deleteError } = await supabase
              .from("time_entries")
              .delete()
              .eq("weekly_report_id", reportId);
              
            if (deleteError) {
              errors.push(`Failed to clear existing time entries: ${deleteError.message}`);
              // Continue anyway to try inserting new entries
            }
          }
          
          // Insert new time entries
          const timeEntriesToInsert = extractedEntries.map(entry => ({
            user_id: user.id,
            date: entry.date,
            time_in: entry.timeIn,
            time_out: entry.timeOut,
            hours: entry.hours,
            created_at: new Date().toISOString()
          }));
          
          const { error: timeEntryError } = await supabase
            .from("time_entries")
            .insert(timeEntriesToInsert);
          
          if (timeEntryError) {
            errors.push(`Failed to insert time entries: ${timeEntryError.message}`);
            // Continue the upload process despite this error
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
      setExtractedEntries([]);
      setTotalHours(0);
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

        {isExtracting && (
          <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Extracting table data from PDF...
          </div>
        )}

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
            <h3 className="text-gray-700 font-medium mb-2">Selected File</h3>
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

        {/* Extracted Time Entries */}
        {extractedEntries.length > 0 && (
          <div className="mt-4">
            <h3 className="text-gray-700 font-medium mb-2">Extracted Time Entries</h3>
            <div className="bg-white rounded border overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase">Time In</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase">Time Out</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase">Hours</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase">Task</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedEntries.map((entry, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 text-sm text-gray-700">{entry.date}</td>
                      <td className="py-2 px-3 text-sm text-gray-700">{entry.timeIn}</td>
                      <td className="py-2 px-3 text-sm text-gray-700">{entry.timeOut}</td>
                      <td className="py-2 px-3 text-sm text-gray-700">{entry.hours}</td>
                      <td className="py-2 px-3 text-sm text-gray-700">{entry.task}</td>
                      <td className="py-2 px-3 text-sm text-gray-700">{entry.remarks}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-medium">
                    <td colSpan={3} className="py-2 px-3 text-sm text-gray-700 text-right">Total Hours:</td>
                    <td className="py-2 px-3 text-sm text-gray-700">{totalHours}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {message && (
          <p className={`mt-4 text-center font-medium p-2 rounded ${
            message.includes("❌") 
              ? "bg-red-100 text-red-600" 
              : message.includes("⚠️") || message.includes("🔍") 
                ? "bg-yellow-100 text-yellow-600" 
                : "bg-green-100 text-green-600"
          }`}>
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

