import React, { useState } from 'react';
import { supabase } from '../../supabase';
import EndorsementSection from './EndorsementSection';
import Company from '../types/Company';
import Job from '../types/Job';
import { useClickOutside } from '../hooks/useClickOutside';

interface AvailabilitySectionProps {
  applicationId: string;
  company: Company;
  job: Job;
  onClose: () => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({ 
  applicationId, 
  company, 
  job, 
  onClose 
}) => {
  const [availability, setAvailability] = useState<{ day: string; startTime: string; endTime: string }[]>([]);
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentStartTime, setCurrentStartTime] = useState("06:00");
  const [currentEndTime, setCurrentEndTime] = useState("17:00");
  const [loading, setLoading] = useState(false);
  const [showEndorsement, setShowEndorsement] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const sectionRef = useClickOutside(() => {
    onClose();
  });

  const formatTime = (time24: string | undefined): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const workingHours = {
    start: "06:00",
    end: "17:00",
    toString() {
      return `${formatTime(this.start)} to ${formatTime(this.end)}`;
    }
  };

  const handleAddAvailabilitySlot = () => {
    if (!currentDay) {
      alert("Please select a day");
      return;
    }

    const startTime = currentStartTime || workingHours.start;
    const endTime = currentEndTime || workingHours.end;

    if (startTime < workingHours.start || startTime > workingHours.end || 
        endTime < workingHours.start || endTime > workingHours.end) {
      alert(`Available hours are ${workingHours.toString()}`);
      return;
    }

    if (startTime >= endTime) {
      alert("Start time must be before end time");
      return;
    }

    if (editingIndex !== null) {
      const updatedAvailability = [...availability];
      updatedAvailability[editingIndex] = { day: currentDay, startTime, endTime };
      setAvailability(updatedAvailability);
      setEditingIndex(null);
    } else {
      setAvailability([...availability, { 
        day: currentDay, 
        startTime, 
        endTime 
      }]);
    }

    setCurrentDay("");
    setCurrentStartTime(workingHours.start);
    setCurrentEndTime(workingHours.end);
  };

  const handleEditAvailability = (index: number) => {
    const slot = availability[index];
    setCurrentDay(slot.day);
    setCurrentStartTime(slot.startTime);
    setCurrentEndTime(slot.endTime);
    setEditingIndex(index);
  };

  const handleAvailabilitySubmit = async () => {
    if (availability.length === 0) {
      alert("Please add at least one availability slot.");
      return;
    }

    setLoading(true);
    
    try {
      const availabilityEntries = availability.map(slot => ({
        application_id: applicationId,
        day_of_week: slot.day,
        start_time: slot.startTime,
        end_time: slot.endTime,
      }));

      const { error } = await supabase
        .from("availability")
        .insert(availabilityEntries);

      if (error) {
        throw new Error(`Error submitting availability: ${error.message}`);
      }

      console.log("Availability submitted successfully");
      setShowEndorsement(true);
    } catch (error) {
      console.error("Error submitting availability:", error);
      alert("Failed to submit availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = (hour % 12 || 12).toString().padStart(2, '0');
    return { hour: displayHour, minute: minutes, period };
  };

  const handleTimeChange = (type: 'start' | 'end', hour: string, minute: string, period: string) => {
    let hourNum = parseInt(hour, 10);
    if (period === 'PM' && hourNum !== 12) hourNum += 12;
    if (period === 'AM' && hourNum === 12) hourNum = 0;
    const time24 = `${hourNum.toString().padStart(2, '0')}:${minute}`;
    if (type === 'start') {
      setCurrentStartTime(time24);
    } else {
      setCurrentEndTime(time24);
    }
  };

  if (showEndorsement) {
    return (
      <EndorsementSection 
        company={company}
        job={job}
        onClose={onClose}
      />
    );
  }

  const startTime = parseTime(currentStartTime);
  const endTime = parseTime(currentEndTime);

  return (
    <div
      ref={sectionRef}
      className="fixed inset-0 bg-gradient-to-b from-[#3657DB] from-24% to-[#8D95B5] to-98% flex items-center justify-center z-50 text-black"
    >
      <div className="border border-gray-200 rounded-2xl p-8 w-[700px] bg-white shadow-2xl max-w-[90vw] mx-auto transition-all duration-300">
        <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">Add Your OJT Availability</h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700 min-w-[120px]">Day of Week</label>
            <select
              value={currentDay}
              onChange={(e) => setCurrentDay(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">Select a day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700 min-w-[120px]">Start Time</label>
            <div className="flex items-center gap-2 flex-1 bg-gray-100 rounded-lg p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <select
                value={startTime.hour}
                onChange={(e) => handleTimeChange('start', e.target.value, startTime.minute, startTime.period)}
                className="border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
              <span className="text-gray-500">:</span>
              <select
                value={startTime.minute}
                onChange={(e) => handleTimeChange('start', startTime.hour, e.target.value, startTime.period)}
                className="border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>{minute}</option>
                ))}
              </select>
              <select
                value={startTime.period}
                onChange={(e) => handleTimeChange('start', startTime.hour, startTime.minute, e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                {periods.map((period) => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700 min-w-[120px]">End Time</label>
            <div className="flex items-center gap-2 flex-1 bg-gray-100 rounded-lg p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <select
                value={endTime.hour}
                onChange={(e) => handleTimeChange('end', e.target.value, endTime.minute, endTime.period)}
                className="border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
              <span className="text-gray-500">:</span>
              <select
                value={endTime.minute}
                onChange={(e) => handleTimeChange('end', endTime.hour, e.target.value, endTime.period)}
                className="border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>{minute}</option>
                ))}
              </select>
              <select
                value={endTime.period}
                onChange={(e) => handleTimeChange('end', endTime.hour, endTime.minute, e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                {periods.map((period) => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAddAvailabilitySlot}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
          >
            {editingIndex !== null ? "Update Availability Slot" : "Add Availability Slot"}
          </button>

          {availability.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700 mb-2">Added Availability:</p>
              <ul className="list-disc pl-5 space-y-1">
                {availability.map((slot, index) => (
                  <li key={index} className="text-gray-600 flex items-center gap-2">
                    <span>
                      {slot.day}: {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                    <button
                      onClick={() => handleEditAvailability(index)}
                      className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      aria-label="Edit availability slot"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button
              onClick={handleAvailabilitySubmit}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Availability"}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySection;