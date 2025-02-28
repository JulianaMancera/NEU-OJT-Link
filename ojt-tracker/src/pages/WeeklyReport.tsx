import { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";

const WeeklyReport = () => {
  const [formData, setFormData] = useState({
    trainee_name: "",
    department: "",
    company: "",
    month_covered: "",
    date: "",
    time_in: "",
    time_out: "",
    hours: "",
    task_completed: "",
    remarks: "",
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
    const reportData = { ...formData, hours: parseInt(formData.hours, 10) };

    const { error } = await supabase.from("ojt_reports").insert([reportData]);

    if (error) {
      setMessage("❌ Error submitting report: " + error.message);
    } else {
      setMessage("✅ Weekly report submitted successfully!");
      setFormData({
        trainee_name: "",
        department: "",
        company: "",
        month_covered: "",
        date: "",
        time_in: "",
        time_out: "",
        hours: "",
        task_completed: "",
        remarks: "",
      });
    }

    setLoading(false);
  };

  return (
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
      name="trainee_name"
      placeholder="Trainee Name"
      value={formData.trainee_name}
      onChange={handleChange}
      required
      className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
    />

    {/* Department */}
    <input
      type="text"
      name="department"
      placeholder="Department"
      value={formData.department}
      onChange={handleChange}
      required
      className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
    />

    {/* Company */}
    <input
      type="text"
      name="company"
      placeholder="Company"
      value={formData.company}
      onChange={handleChange}
      required
      className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
    />

    {/* Month Covered */}
    <input
      type="text"
      name="month_covered"
      placeholder="Month Covered (e.g., January 2025)"
      value={formData.month_covered}
      onChange={handleChange}
      required
      className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
    />

    {/* Date */}
    <input
      type="date"
      name="date"
      value={formData.date}
      onChange={handleChange}
      required
      className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
    />

    {/* Time In */}
    <input
      type="time"
      name="time_in"
      value={formData.time_in}
      onChange={handleChange}
      required
      className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
    />

    {/* Time Out */}
    <input
      type="time"
      name="time_out"
      value={formData.time_out}
      onChange={handleChange}
      required
      className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
    />

    {/* Hours */}
    <input
      type="number"
      name="hours"
      placeholder="Hours Worked"
      value={formData.hours}
      onChange={handleChange}
      required
      className="w-full p-3 text-lg border border-gray-500 rounded-lg bg-white text-gray-900"
    />

    {/* Task Completed */}
    <textarea
      name="task_completed"
      placeholder="Task Completed"
      value={formData.task_completed}
      onChange={handleChange}
      required
      className="w-full p-4 text-lg border border-gray-500 rounded-lg bg-white text-gray-900 h-28"
    ></textarea>

    {/* Remarks */}
    <textarea
      name="remarks"
      placeholder="Remarks"
      value={formData.remarks}
      onChange={handleChange}
      required
      className="w-full p-4 text-lg border border-gray-500 rounded-lg bg-white text-gray-900 h-28"
    ></textarea>

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

  );
};

export default WeeklyReport;
