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

    setAvailability([...availability, { 
      day: currentDay, 
      startTime, 
      endTime 
    }]);

    setCurrentDay("");
    setCurrentStartTime(workingHours.start);
    setCurrentEndTime(workingHours.end);
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

  if (showEndorsement) {
    return (
      <EndorsementSection 
        company={company}
        job={job}
        onClose={onClose}
      />
    );
  }

  return (
    <div ref={sectionRef} className="text-black">
      <p className="text-center text-xl font-bold mb-4">Add Your OJT Availability</p>
      <div className="border border-black rounded-lg p-5 w-[600px]">
        <div className="mb-4">
          <label className="font-bold min-w-[150px]">Day of Week</label>
          <select
            value={currentDay}
            onChange={(e) => setCurrentDay(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
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
        <div className="mb-4">
          <label className="font-bold min-w-[150px]">Start Time</label>
          <input
            type="time"
            value={currentStartTime}
            onChange={(e) => setCurrentStartTime(e.target.value)}
            min={workingHours.start}
            max={workingHours.end}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
        <div className="mb-4">
          <label className="font-bold min-w-[150px]">End Time</label>
          <input
            type="time"
            value={currentEndTime}
            onChange={(e) => setCurrentEndTime(e.target.value)}
            min={workingHours.start}
            max={workingHours.end}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
        <button
          onClick={handleAddAvailabilitySlot}
          className="text-white bg-green-500 px-4 py-2 rounded mb-4"
        >
          Add Availability Slot
        </button>
        {availability.length > 0 && (
          <div className="mb-4">
            <p className="font-semibold">Added Availability:</p>
            <ul className="list-disc pl-5">
              {availability.map((slot, index) => (
                <li key={index}>
                  {slot.day}: {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <button 
          onClick={handleAvailabilitySubmit} 
          className="text-white bg-blue-500 px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Availability'}
        </button>
        <button 
          onClick={onClose} 
          className="text-white bg-gray-500 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AvailabilitySection; 