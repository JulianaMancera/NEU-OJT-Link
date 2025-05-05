import { useState, useEffect } from "react";
import { supabase } from "../../../supabase";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";
import { extractTableFromPdf } from "../../services/pdfFileExtractor";


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
  const [,setSubmittedWeeks] = useState<number[]>([]);
  const [nextExpectedWeek,  setNextExpectedWeek]  = useState<number>(1);
  const [selectedFileWeek,  setSelectedFileWeek]  = useState<number|null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [loadingWeeks, setLoadingWeeks] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || editingReport) return;
    setLoadingWeeks(true);

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmittedWeeks([]);
        setNextExpectedWeek(1);
        setLoadingWeeks(false);
         return;
    }
      const { data, error } = await supabase
        .from("weekly_report")
        .select("week_number")
        .eq("user_id", user.id);

        const weeks: number[] = !error && data
      ? data
          .map(r => r.week_number)
          .filter((n): n is number => typeof n === "number" && n > 0)
          .sort((a,b) => a-b)
      : [];

    let next = 1;
    for (const w of weeks) {
      if (w === next) next++;
      else if (w > next) break;
    }
    setNextExpectedWeek(next);
    setLoadingWeeks(false);
  })();
}, [isOpen, editingReport]);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setMessage("");
      setProgress(null);
      setExtractedEntries([]);
      setTotalHours(0);
      setSelectedFileWeek(null);
    }
  }, [isOpen]);

  const resetMessage = () => setMessage("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const selectedFiles = Array.from(fileList);
      setFiles(selectedFiles);

      // immediately pull week number from filename
      const filenameWeek = extractWeekNumber(selectedFiles[0].name);
      setSelectedFileWeek(filenameWeek);
      
      // Extract table data from the first PDF
      if (selectedFiles.length > 0 && selectedFiles[0].type === "application/pdf") {
        await extractTableFromPdf(selectedFiles[0]);
      }
    
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    setFiles(droppedFiles);
    
    const filenameWeek = extractWeekNumber(droppedFiles[0].name);
    setSelectedFileWeek(filenameWeek);
    
    // Extract table data from the first PDF
    if (droppedFiles.length > 0 && droppedFiles[0].type === "application/pdf") {
      await extractTableFromPdf(droppedFiles[0]);
    }
  };

  const extractTableFromPdf = async (file: File) => {
    setIsExtracting(true);
    setMessage("🔍 Extracting table data from PDF...");
    
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load PDF document
      const pdf = await pdfjs.getDocument({data: new Uint8Array(arrayBuffer)}).promise;
      
      const entries: TimeEntry[] = [];
      let totalHoursSum = 0;
      
      // Process each page to look for table data
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text items with their positions
        const items = textContent.items.map((item: any) => ({
          text: item.str,
          x: item.transform[4], // x position
          y: item.transform[5], // y position
          height: item.height
        }));
        
        // Sort items by y-position (top to bottom) and then by x-position (left to right)
        // This helps us read the table row by row
        const sortedItems = items.sort((a, b) => {
          if (Math.abs(a.y - b.y) > 1) {
            return b.y - a.y; // Top to bottom
          } else {
            return a.x - b.x; // Left to right within same row
          }
        });

        
        // Process rows to extract table data
        let currentRow: any[] = [];
        let lastY = 0;
        
        sortedItems.forEach((item) => {
          if (currentRow.length === 0 || Math.abs(item.y - lastY) < 10) {
            // Same row or first item
            currentRow.push(item);
          } else {
            // New row detected
            // Process completed row if it looks like a data row
            processTableRow(currentRow, entries);
            // Start new row
            currentRow = [item];
          }
          lastY = item.y;
        });
        
        // Process the last row
        if (currentRow.length > 0) {
          processTableRow(currentRow, entries);
        }
      }
      
      // Calculate total hours
      totalHoursSum = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      setTotalHours(totalHoursSum);
      
      setExtractedEntries(entries);
      setMessage(`✅ Found ${entries.length} time entries in the PDF. Total hours: ${totalHoursSum}`);
    } catch (error) {
      console.error("Error extracting table from PDF:", error);
      setMessage("❌ Failed to extract table data from PDF.");
    } finally {
      setIsExtracting(false);
    }
  };

  const computeEndDate = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay(); // Sunday=0 … Saturday=6
    const daysUntilSat = (6 - day + 7) % 7;
    date.setDate(date.getDate() + daysUntilSat);
    // clamp to end‐of‐day
    date.setHours(23, 59, 59, 999);
    return date;
  };
  
  const processTableRow = (rowItems: any[], entries: TimeEntry[]) => {
    // Skip header rows or empty rows
    if (rowItems.length < 5) return;
  
    let rowData = rowItems.map(item => item.text).filter(text => text.trim() != '');
    rowData = mergeSplitTimes(rowData);
    if (rowData.length < 5) return;
  
    console.log("Parsed Row: ", rowData);
  
    // Attempt to reconstruct a date from adjacent pieces
    let date = '';
    let dateStartIndex = -1;
    for (let i = 0; i < rowData.length - 2; i++) {
      const combined = rowData[i] + rowData[i + 1] + rowData[i + 2];
      if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(combined)) {
        date = combined;
        dateStartIndex = i;
        break;
      }
    }
    if(dateStartIndex !== -1){
      rowData.splice(dateStartIndex, 3, date)
    }
  
    if (date) {
      // Extract values based on the expected table structure
      let timeIn = '';
      let timeOut = '';
      let hours = 0;
      let task = '';
      let remarks = '';


 
      // Find time in and out
      const timePattern = /\d{1,2}:\d{2}[AP]M/i;
      const timesFound = rowData.filter(text => text.match(timePattern));
      if (timesFound.length >= 2) {
        timeIn = timesFound[0];
        timeOut = timesFound[1];
      }
  
      // Find hours
      const hoursPattern = /^\d+$/;
      const hoursText = rowData.find(text => text.match(hoursPattern));
      if (hoursText) {
        hours = parseInt(hoursText, 10);
      }
  
      // Extract task and remarks
      const nonMatchingItems = rowData.filter(text =>
        !text.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
        !text.match(timePattern) &&
        !text.match(hoursPattern) &&
        text.trim().length > 0
      );
  
      if (nonMatchingItems.length > 0) {
        task = nonMatchingItems[0];
        remarks = nonMatchingItems.slice(1).join(' ');
      }
  
      // Only add entry if we have a date and hours
      if (date && hours) {
        entries.push({
          date,
          timeIn,
          timeOut,
          hours,
          task,
          remarks
        });
      }
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

    const uploadDisabled =
    loadingWeeks                  ||  // still fetching your past submissions
    uploading                     ||  // or mid‑upload
    files.length === 0            ||  // or no file picked
    (!editingReport && (
        selectedFileWeek !== nextExpectedWeek
    ));

  const extractWeekNumber = (fileName: string): number | null => {
    const match = fileName.match(/Week(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("❌ Please select at least one file.");
      return;
    }

    if (!editingReport && selectedFileWeek !== nextExpectedWeek) {
      setMessage(`❌ Please upload Week ${nextExpectedWeek} next.`);
      return;
          }
    
    if (loadingWeeks) {
      setMessage("🔄 Still checking which week comes next…");
      return;
          }
    if (!editingReport && selectedFileWeek !== nextExpectedWeek) {
      setMessage(`❌ Please upload Week ${nextExpectedWeek} next.`);
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
              end_date:   computeEndDate(new Date()).toISOString(),
              user_id: user.id,
              week_number: extractedWeek,
              total_hours: totalHours,
              status: 'pending',
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

    /**
 * Given any Date, returns a Date set to the coming Saturday at 23:59:59.999,
 * or to the same date if it's already Saturday.
 */
    
    
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
            disabled={uploadDisabled}
            className="w-full bg-blue-600 text-white py-2 mt-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {editingReport
              ? "UPDATE REPORT"
              : `UPLOAD WEEK ${nextExpectedWeek} REPORT`}
          </button>
      </div>
    </div>
  );
};

export default WeeklyReport;

function mergeSplitTimes(data : string[]): string[] {
  const merged: string[] = [];
  let i = 0;
  while (i < data.length) {
    const current = data[i].trim();
    const next = data[i + 1]?.trim();

    if (/\d{1,2}:\d{2}/.test(current) && /^(AM|PM)$/i.test(next)) {
      merged.push(current + next.toUpperCase());
      i += 2; // Skip next
    } else {
      merged.push(current);
      i += 1;
    }
  }
  return merged;
}
