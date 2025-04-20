import { useState } from "react";
import { supabase } from "../../supabase";
import { Plus, Minus } from "lucide-react";

interface Company {
  company_id: string;
  name: string;
}

interface JobFormProps {
  companies: Company[];
  onSuccess: () => void;
  onClose: () => void;
}

const AddJobForm = ({ companies, onSuccess, onClose }: JobFormProps) => {
  const [newJob, setNewJob] = useState({
    company_id: "",
    position: "",
    slots: 1
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!newJob.position || !newJob.company_id) {
      setMessage("❌ Please fill all fields");
      setTimeout(() => setMessage(""), 3000);
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("job").insert([newJob]);

    if (error) {
      setMessage(`❌ Failed to add job: ${error.message}`);
      console.error(error);
    } else {
      setMessage("✅ Job added successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    }
    setIsSubmitting(false);
  };

  const handleSlotChange = (delta: number) => {
    setNewJob(prev => ({
      ...prev,
      slots: Math.max(1, prev.slots + delta)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>
      
      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Modal panel */}
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Modal content */}
          <div className="bg-white px-6 py-6 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Job Position</h2>
            
            {message && (
              <div className={`mb-6 p-3 rounded-md ${
                message.includes("❌") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Position
                </label>
                <input
                  id="position"
                  type="text"
                  value={newJob.position}
                  onChange={(e) => setNewJob({...newJob, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <select
                  id="company"
                  value={newJob.company_id}
                  onChange={(e) => setNewJob({...newJob, company_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Slots
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleSlotChange(-1)}
                    className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    disabled={newJob.slots <= 1}
                  >
                    <Minus size={16} className="text-current" />
                  </button>
                  <span className="w-12 text-center text-lg font-medium text-gray-900">{newJob.slots}</span>
                  <button
                    type="button"
                    onClick={() => handleSlotChange(1)}
                    className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  >
                    <Plus size={16} className="text-current" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Adding..." : "Add Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddJobForm;