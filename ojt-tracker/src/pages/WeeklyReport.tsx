import { useState } from "react";
import { supabase } from "../../supabase";
const WeeklyReport = () => {
  const [formData, setFormData] = useState({
    submitted_by: "",
    start_date: "",
    hours_rendered: "",
    task_completed: "",
    end_date: "",
    week_number: "",
    status: "pending",
    created_at: new Date().toISOString(),
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Convert hours to number
// Convert date to proper format
    const reportData = {
    ...formData,
    start_date: formData.start_date ? new Date(formData.start_date).toISOString().split("T")[0] : null,
    end_date: formData.end_date ? new Date(formData.end_date).toISOString().split("T")[0] : null,
    };

    const { error } = await supabase.from("weekly_report").insert([reportData]);

    if (error) {
      setMessage("❌ Error submitting report: " + error.message);
      
    } else {
      setMessage("✅ Weekly report submitted successfully!");
      setFormData({
      submitted_by: "",
      start_date: "",
      end_date: "",
      hours_rendered: "",
      task_completed: "",
      week_number: "",
      status:"pending",
      created_at: new Date().toISOString(),
    });
    }

    setLoading(false);
  };

  return (
  <div className="flex items-center justify-center w-screen min-h-screen bg-gray-500">
    <div className="max-w-3xl mx-auto p-8 bg-gray-100 shadow-lg rounded-xl">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Submit Weekly OJT Report</h2>

      {message && (
        <p className="mb-6 text-lg text-center font-semibold text-green-600 bg-green-100 p-2 rounded">
      {message}
      </p>
    )}

    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Trainee Name */}
      <input
        type="text"
        name="submitted_by"
        placeholder="Name"
        value={formData.submitted_by}
        onChange={handleChange}
        required
        className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
      />
      {/* Start-Date */}

      <input
        type="date"
        name="start_date"
        placeholder="Start date"
        value={formData.start_date}
        onChange={handleChange}
        required
        className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
      />
      {/* End-Date */}
      <input
        type="date"
        name="end_date"
        placeholder="End date"
        value={formData.end_date}
        onChange={handleChange}
        required
        className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
      />
        {/* Hours Rendered */}
      <input
        type="number"
        name="hours_rendered"
        placeholder="Hours rendered"
        value={formData.hours_rendered}
        onChange={handleChange}
        required
        className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
      />

      {/* Task Completed */}
      <input
        type="text"
        name="task_completed"
        placeholder="Task completed"
        value={formData.task_completed}
        onChange={handleChange}
        required
        className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
      />

      {/* Hours */}
      <input
        type="number"
        name="week_number"
        placeholder="Week_number "
        value={formData.week_number}
        onChange={handleChange}
        required
        className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition"
        disabled={loading}
      >
            {loading ? "Submitting..." : "Submit Report"}
        </button>
    </form>
  </div>
  </div>
  );
};

export default WeeklyReport;
