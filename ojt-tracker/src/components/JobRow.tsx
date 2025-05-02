import { Briefcase, Pencil, Save, Minus, Plus, Ban } from "lucide-react";
import { Job } from "../services/JobService";
import { Company } from "../services/JobService";

interface JobRowProps {
  job: Job;
  companies: Company[];
  editMode: number | null;
  onEditToggle: (jobId: number) => void;
  onJobChange: (jobId: number, value: string) => void;
  onCompanyChange: (jobId: number, companyId: string) => void;
  onSlotChange: (jobId: number, delta: number) => void;
  onSave: (job: Job) => void;
  onRestrictToggle: (jobId: number) => void;
}

export const JobRow = ({
  job,
  companies,
  editMode,
  onEditToggle,
  onJobChange,
  onCompanyChange,
  onSlotChange,
  onSave,
  onRestrictToggle
}: JobRowProps) => {
  const availableSlots = job.slots !== null && job.slots !== undefined ? 
  job.slots : 
  (job.total_slots || 0) - (job.approved_application_count || 0);

  return (
    <div 
      key={job.job_id} 
      className={`grid grid-cols-12 items-center text-left border-b-1 border-black p-2 text-black border-l-2 border-r-2 ${
        !job.isAvailable ? 'opacity-70 bg-gray-200' : ''
      }`} 
      style={{ backgroundColor: '#D9D9D9' }}
    >
      {/* Job column */}
      <div className="col-span-3 flex items-center ml-2">
        <Briefcase className="mr-2" />
        {editMode === job.job_id ? (
          <input
            value={job.position}
            onChange={(e) => onJobChange(job.job_id, e.target.value)}
            className="border border-black px-2 py-1 rounded w-full text-black"
          />
        ) : (
          <span className={!job.isAvailable ? 'line-through' : ''}>
            {job.position}
          </span>
        )}
      </div>

      {/* Slots column - now showing available slots */}
      <div className="col-span-2 flex justify-center items-center gap-2 mr-3">
        {editMode === job.job_id ? (
          <>
            <button
              onClick={() => onSlotChange(job.job_id, -1)}
              className="p-1 rounded border border-black bg-white text-black"
              disabled={availableSlots <= 0}
            >
              <Minus size={16} />
            </button>
            <span>{availableSlots}</span>
            <button
              onClick={() => onSlotChange(job.job_id, 1)}
              className="p-1 rounded border border-black bg-white text-black"
              disabled={availableSlots >= (job.total_slots || 0) + 1}
            >
              <Plus size={16} />
            </button>
          </>
        ) : (
          <span>{availableSlots}</span>
        )}
      </div>

      {/* Company column */}
      <div className="col-span-3">
        {editMode === job.job_id ? (
          <select
            value={job.company_id}
            onChange={(e) => onCompanyChange(job.job_id, e.target.value)}
            className="border border-black rounded p-1 w-full text-black"
          >
            <option value="">Companies Affiliated</option>
            {companies.map((company) => (
              <option key={company.company_id} value={company.company_id}>
                {company.name}
              </option>
            ))}
          </select>
        ) : (
          <span>{companies.find(c => c.company_id === job.company_id)?.name || "N/A"}</span>
        )}
      </div>

      {/* Configure buttons */}
      <div className="col-span-4 flex justify-center gap-2">
        {editMode === job.job_id ? (
          <button
            onClick={() => onSave(job)}
            className="bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1 border border-black"
          >
            <Save size={16} /> Save
          </button>
        ) : (
          <button
            onClick={() => onEditToggle(job.job_id)}
            disabled={!job.isAvailable}
            className={`px-3 py-1 rounded flex items-center gap-1 border ${
              job.isAvailable 
                ? "border-black text-black bg-[#90D5FF] hover:bg-blue-200 cursor-pointer" 
                : "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
            }`}
          >
            <Pencil size={16} className={job.isAvailable ? "" : "text-gray-400"} /> 
            Edit
          </button>
        )}
        
        <button
          onClick={() => onRestrictToggle(job.job_id)}
          className={`px-3 py-1 rounded flex items-center gap-1 ${
            job.isAvailable
              ? "border border-red-500 text-black-500 bg-white hover:bg-red-50"
              : "border border-green-600 text-green-600 bg-green-50 hover:bg-green-100"
          }`}
        >
          {job.isAvailable ? (
            <>
              <Ban size={16} className="text-red-500" />
              Restrict
            </>
          ) : (
            <>
              Unrestrict
            </>
          )}
        </button>
      </div>
    </div>
  );
};