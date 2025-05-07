import { useState, useEffect } from "react"; 
import { supabase } from "../../../supabase";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";
import { extractTableFromPdf } from "../../services/pdfFileExtractor";
import { computeEndDate } from "../../services/ComputeDate/EndDate";
import { getNextExpectedWeek } from "../../services/WeekValidation/getNextExpectedWeek";

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
  const [nextExpectedWeek, setNextExpectedWeek] = useState<number>(1);
  const [loadingWeek, setLoadingWeek] = useState<boolean>(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [extractedEntries, setExtractedEntries] = useState<TimeEntry[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [totalHours, setTotalHours] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || editingReport) return;
  
    setLoadingWeek(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setNextExpectedWeek(1);
        setLoadingWeek(false);
        return;
      }
      return getNextExpectedWeek(user.id)
        .then((n) => setNextExpectedWeek(n))
        .finally(() => setLoadingWeek(false));
    });
  }, [isOpen, editingReport]);

  const resetState = () => {
    setFiles([]);
    setMessage("");
    setProgress(null);
    setExtractedEntries([]);
    setTotalHours(0);
  };

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

    if (!editingReport) {
    if (loadingWeek) {
      setMessage("🔄 Checking which week comes next…");
      return;
    }
    // pull the week number off your filename
    const fnWeek = extractWeekNumber(files[0].name);
    if (fnWeek !== nextExpectedWeek) {
      setMessage(`❌ Please upload Week ${nextExpectedWeek} next.`);
      return;
    }
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
              end_date: computeEndDate(new Date()),
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
          if (editingReport) {
            const { error: deleteError } = await supabase
              .from("time_entries")
              .delete()
              .eq("weekly_report_id", reportId);

            if (deleteError) {
              errors.push(`Failed to clear existing time entries: ${deleteError.message}`);
            }
          }

          const timeEntriesToInsert = extractedEntries.map(entry => ({
            user_id: user.id,
            date: entry.date,
            time_in: entry.timeIn,
            time_out: entry.timeOut,
            hours: entry.hours,
            task: entry.task,
            remarks: entry.remarks,
            created_at: new Date().toISOString()
          }));

          const { error: timeEntryError } = await supabase
            .from("time_entries")
            .insert(timeEntriesToInsert);

          if (timeEntryError) {
            errors.push(`Failed to insert time entries: ${timeEntryError.message}`);
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
      setMessage(`✅ Uploaded ${completed} report(s) successfully with ${errors.length} errors.`);
      console.error("Upload errors:", errors);
    } else {
      setMessage(`✅ Uploaded ${completed} report(s) successfully.`);
      resetState();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="fixed inset-0"
        onClick={() => {
          onClose();
          resetMessage();
        }}
      ></div>
      <div className="relative bg-gray-200 shadow-xl rounded-lg p-6 border-2 w-full max-w-2xl z-50">
        <h2 className="text-gray-700 text-2xl font-semibold text-center mb-4">
          {editingReport
            ? `EDIT WEEK ${editingReport.week_number} REPORT`
            : "UPLOAD WEEKLY REPORT"}
        </h2>
        <label
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 bg-white p-6 rounded-lg cursor-pointer hover:bg-gray-300"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <FaCloudUploadAlt className="text-4xl text-gray-600 mb-2" />
          <p className="text-gray-600">
            Drag & drop files or{" "}
            <span className="text-blue-600 font-semibold">Browse</span>
          </p>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {files.length > 0 && (
          <div className="mt-4 text-gray-700">
            <h3 className="text-lg font-semibold">Files Selected</h3>
            <ul className="bg-white list-disc pl-6 mt-2">
              {files.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span>{file.name}</span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-red-500 hover:underline flex items-center space-x-1"
                  >
                    <FaTrash />
                    <span>Remove</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
       
      )}
      {progress !== null && (
        <div className="mt-4 text-blue-600 font-semibold">
          Upload Progress: {progress}%
        </div>
      )}
      {isExtracting && (
        <div className="mt-2 text-yellow-600">Extracting PDF contents...</div>
      )}
      {message && (
        <div className="mt-4 text-sm text-gray-800 bg-gray-100 p-3 rounded shadow">
          {message}
        </div>
      )}
      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || isExtracting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Submit"}
        </button>
      </div>
    </div>
  </div>
);
};

export default WeeklyReport;
