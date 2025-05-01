import { useEffect, useState } from "react";
import { fetchCompanies, fetchJobs, updateJob, Job, Company, fetchApprovedApplicationsCount } from "../../services/JobService";
import { JobRow } from "../../components/JobRow";
import AddJobForm from "../../components/AddJobsForm";
import { MessageNotification } from "../../components/MessageNotification";
import Sidebar from "../../components/SideBar";
import OJTLogo from "/src/assets/ojt-white.png";

interface ExtendedJob extends Job {
  availableSlots: number;
}

const AddJobs = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<ExtendedJob[]>([]);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, jobsData] = await Promise.all([
          fetchCompanies(),
          fetchJobs()
        ]);
        
        const jobsWithAvailableSlots = await Promise.all(
          jobsData.map(async (job) => {
            const approvedCount = await fetchApprovedApplicationsCount(job.job_id);
            return {
              ...job,
              availableSlots: Math.max(0, job.slots - approvedCount)
            };
          })
        );

        setCompanies(companiesData);
        setJobs(jobsWithAvailableSlots);
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage("❌ Failed to load data");
        setTimeout(() => setMessage(""), 3000);
      }
    };
    loadData();
  }, []);

  const handleEditToggle = (jobId: number) => {
    setEditMode(editMode === jobId ? null : jobId);
  };

  const handleJobChange = (jobId: number, value: string) => {
    setJobs(jobs.map(j => j.job_id === jobId ? { ...j, position: value } : j));
  };

  const handleCompanyChange = (jobId: number, companyId: string) => {
    setJobs(jobs.map(j => j.job_id === jobId ? { ...j, company_id: companyId } : j));
  };

  const handleSlotChange = (jobId: number, delta: number) => {
    setJobs(jobs.map(j => {
      if (j.job_id === jobId) {
        const newSlots = Math.max(0, j.slots + delta);
        return { 
          ...j, 
          slots: newSlots,
          availableSlots: Math.max(0, newSlots - (j.slots - j.availableSlots))
        };
      }
      return j;
    }));
  };

  const handleSave = async (job: ExtendedJob) => {
    try {
      // Create a Job object without the ExtendedJob properties
      const jobToSave: Job = {
        job_id: job.job_id,
        company_id: job.company_id,
        position: job.position,
        slots: job.slots,
        isAvailable: job.isAvailable
      };
      
      await updateJob(jobToSave);
      setMessage("✅ Job updated successfully!");
      setEditMode(null);
      
      // Refresh data to get updated application counts
      const jobsData = await fetchJobs();
      const updatedJobs = await Promise.all(
        jobsData.map(async (j) => {
          const approvedCount = await fetchApprovedApplicationsCount(j.job_id);
          return {
            ...j,
            availableSlots: Math.max(0, j.slots - approvedCount)
          };
        })
      );
      setJobs(updatedJobs);
    } catch (error) {
      console.error("Error saving job:", error);
      setMessage("❌ Failed to save changes.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleRestrictToggle = async (jobId: number) => {
    const job = jobs.find(j => j.job_id === jobId);
    if (!job) return;

    const newStatus = !job.isAvailable;
    
    try {
      const jobToUpdate: Job = {
        job_id: job.job_id,
        company_id: job.company_id,
        position: job.position,
        slots: job.slots,
        isAvailable: newStatus
      };
      
      await updateJob(jobToUpdate);
      setMessage(`✅ Job ${newStatus ? "unrestricted" : "restricted"} successfully!`);
      
      // Refresh data
      const jobsData = await fetchJobs();
      const updatedJobs = await Promise.all(
        jobsData.map(async (j) => {
          const approvedCount = await fetchApprovedApplicationsCount(j.job_id);
          return {
            ...j,
            availableSlots: Math.max(0, j.slots - approvedCount)
          };
        })
      );
      setJobs(updatedJobs);
    } catch (error) {
      console.error("Error toggling job status:", error);
      setMessage(`❌ Failed to ${newStatus ? "unrestrict" : "restrict"} job`);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="relative min-h-screen w-screen bg-blue-100 p-6">
      <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
      </div>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

      <div className="mt-24 bg-white border border-black rounded-lg p-6 max-w-6xl mx-auto">
        <MessageNotification message={message} />
        <div className="mb-4">
          <div className="flex justify-center mb-2">
            <h2 className="text-[1.8rem] font-bold text-black">Add Jobs</h2>
          </div>
          <div className="flex justify-start">
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center w-48 px-4 py-2 rounded border border-black text-black bg-[#90D5FF] hover:bg-blue-200 transition-colors">
              + Add Job
            </button>

            {showForm && (
              <AddJobForm 
                companies={companies}
                onSuccess={async () => {
                  const jobsData = await fetchJobs();
                  const updatedJobs = await Promise.all(
                    jobsData.map(async (j) => {
                      const approvedCount = await fetchApprovedApplicationsCount(j.job_id);
                      return {
                        ...j,
                        availableSlots: Math.max(0, j.slots - approvedCount)
                      };
                    })
                  );
                  setJobs(updatedJobs);
                  setMessage("✅ Job added successfully!");
                  setTimeout(() => setMessage(""), 3000);
                }}
                onClose={() => setShowForm(false)}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 font-semibold p-2 rounded text-black border-2" style={{ backgroundColor: '#E8E8E8' }}>
          <div className="col-span-3 ml-10">Job</div>
          <div className="col-span-2 ml-16">Slots</div>
          <div className="col-span-3">Company</div>
          <div className="col-span-4 ml-18">Configure</div>
        </div>

        {jobs.map((job) => (
          <JobRow
            key={job.job_id}
            job={{
              ...job,
              slots: job.availableSlots // Pass availableSlots as slots to the component
            }}
            companies={companies}
            editMode={editMode}
            onEditToggle={handleEditToggle}
            onJobChange={handleJobChange}
            onCompanyChange={handleCompanyChange}
            onSlotChange={handleSlotChange}
            onSave={handleSave}
            onRestrictToggle={handleRestrictToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default AddJobs;