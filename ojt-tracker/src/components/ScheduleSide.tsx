import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { UserSquare2 } from "lucide-react";
import { Calendar, momentLocalizer, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface WorkDay {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface Holiday {
  id: number;
  title: string;
  date: Date;
}

interface LogEntry {
  id: string;
  hours: number;
  logged_at: string;
}

const localizer = momentLocalizer(moment);

const ScheduleSide: React.FC = () => {
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [jobPosition, setJobPosition] = useState<string | null>(null);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [totalHours, setTotalHours] = useState<number | null>(null); // Initialize as null
  const [hoursInput, setHoursInput] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch company info, work days, total hours, logs, and holidays
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("User fetch error:", userError?.message);
          setError("User not authenticated.");
          return;
        }

        // Fetch company and job details
        const { data: application, error: applicationError } = await supabase
          .from("application")
          .select("company_id, job_id, application_id")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .single();

        if (applicationError || !application) {
          console.error("No approved application found:", applicationError?.message);
          setError("No approved application found.");
          return;
        }

        const { company_id, job_id, application_id } = application;

        const { data: company, error: companyError } = await supabase
          .from("company")
          .select("name, logo_url")
          .eq("company_id", company_id)
          .single();

        if (companyError || !company) {
          console.error("Company not found:", companyError?.message);
          setError("Company not found.");
          return;
        }

        const { data: job, error: jobError } = await supabase
          .from("job")
          .select("position")
          .eq("job_id", job_id)
          .single();

        if (jobError || !job) {
          console.error("Job position not found:", jobError?.message);
          setError("Job position not found.");
          return;
        }

        setCompanyLogo(company.logo_url);
        setCompanyName(company.name);
        setJobPosition(job.position);
        await fetchWorkDays(application_id);

        // Fetch total hours with explicit reset logic
        const { data: hoursData, error: hoursError } = await supabase
          .from("user_hours")
          .select("total_hours")
          .eq("user_id", user.id)
          .single();

        console.log("Hours fetch result:", { hoursData, hoursError });

        if (hoursError) {
          if (hoursError.code === "PGRST116") {
            console.log("No hours record found, initializing to 300...");
            const { error: insertError } = await supabase
              .from("user_hours")
              .insert({ user_id: user.id, total_hours: 300 });

            if (insertError) {
              console.error("Error initializing total hours:", insertError.message);
              setError("Failed to initialize hours.");
              return;
            }
            setTotalHours(300);
            console.log("Total hours reset to 300 after initialization");
          } else {
            console.error("Error fetching total hours:", hoursError.message);
            setError("Failed to load hours data.");
            return;
          }
        } else if (hoursData) {
          setTotalHours(hoursData.total_hours);
          console.log("Total hours set to:", hoursData.total_hours);
        } else {
          // Fallback in case hoursData is null or undefined but no error
          console.log("Unexpected: hoursData is null, initializing to 300...");
          const { error: insertError } = await supabase
            .from("user_hours")
            .insert({ user_id: user.id, total_hours: 300 });

          if (insertError) {
            console.error("Error initializing total hours:", insertError.message);
            setError("Failed to initialize hours.");
            return;
          }
          setTotalHours(300);
          console.log("Total hours reset to 300 (fallback)");
        }

        // Fetch logs
        const { data: logsData, error: logsError } = await supabase
          .from("hours_logs")
          .select("id, hours, logged_at")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: false });

        if (logsError) {
          console.error("Error fetching logs:", logsError.message);
          setError("Failed to load hours logs.");
          return;
        }

        if (logsData) {
          setLogs(logsData.map(log => ({
            id: log.id,
            hours: log.hours,
            logged_at: new Date(log.logged_at).toLocaleString(),
          })));
        }

        // Fetch holidays
        const { data: holidaysData, error: holidaysError } = await supabase
          .from("holidays")
          .select("id, title, date")
          .gte("date", "2025-01-01")
          .lte("date", "2026-12-31")
          .order("date", { ascending: true });

        if (holidaysError) {
          console.error("Error fetching holidays:", holidaysError.message);
          setError("Failed to load holidays.");
          return;
        }

        if (holidaysData) {
          setHolidays(holidaysData.map(holiday => ({
            id: holiday.id,
            title: holiday.title,
            date: new Date(holiday.date),
          })));
        }
      } catch (err) {
        console.error("Unexpected error in fetchData:", err);
        setError("An unexpected error occurred while loading data.");
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const fetchWorkDays = async (applicationId: string) => {
    const { data, error } = await supabase
      .from("availability")
      .select("day_of_week, start_time, end_time")
      .eq("application_id", applicationId)
      .order("day_of_week");

    if (error) {
      console.error("Error fetching work days:", error.message);
      setError("Failed to load work schedule.");
      return;
    }

    if (data && data.length > 0) {
      const formattedWorkDays = data.map(day => ({
        day_of_week: day.day_of_week,
        start_time: formatTime(day.start_time),
        end_time: formatTime(day.end_time)
      }));
      setWorkDays(formattedWorkDays);
    }
  };

  const formatTime = (time24: string): string => {
    const timeParts = time24.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${period}`;
  };

  const sortDaysOfWeek = (days: WorkDay[]): WorkDay[] => {
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return [...days].sort((a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week));
  };

  const handleHoursSubmit = async () => {
    const hours = parseFloat(hoursInput);
    if (!isNaN(hours) && hours > 0 && totalHours !== null) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("User not authenticated.");
        return;
      }

      // Insert new log entry
      const { data: logData, error: logError } = await supabase
        .from("hours_logs")
        .insert({ user_id: user.id, hours })
        .select("id, hours, logged_at")
        .single();

      if (logError) {
        console.error("Error saving log:", logError.message);
        setError("Failed to save hours log.");
        return;
      }

      // Update total hours
      const newTotalHours = Math.max(0, totalHours - hours);
      const { error: hoursError } = await supabase
        .from("user_hours")
        .update({ total_hours: newTotalHours })
        .eq("user_id", user.id);

      if (hoursError) {
        console.error("Error updating total hours:", hoursError.message);
        setError("Failed to update total hours.");
        return;
      }

      // Update state
      setTotalHours(newTotalHours);
      setLogs(prev => [{
        id: logData.id,
        hours: logData.hours,
        logged_at: new Date(logData.logged_at).toLocaleString(),
      }, ...prev]);
      setHoursInput("");
      setError(null);
    }
  };

  // Function to determine if a day should be highlighted
  const dayPropGetter = (date: Date) => {
    const dayOfWeek = moment(date).format('dddd'); // e.g., "Monday"
    const isWorkDay = workDays.some(workDay => workDay.day_of_week === dayOfWeek);

    if (isWorkDay) {
      return {
        style: {
          backgroundColor: '#d1fae5', // Light green for work days
        },
      };
    }
    return {};
  };

  // Custom toolbar to style the month label
  const CustomToolbar: React.FC<ToolbarProps<Holiday>> = (toolbar) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className="text-xl font-bold text-gray-900">
          {date.format('MMMM YYYY')}
        </span>
      );
    };

    return (
      <div className="rbc-toolbar flex flex-col items-center space-y-2">
        <div className="rbc-toolbar-label">{label()}</div>
        <div className="flex justify-between w-full">
          <span className="rbc-btn-group">
            <button type="button" onClick={goToCurrent} className="px-3 py-1 border border-gray-300 rounded-md">
              Today
            </button>
            <button type="button" onClick={goToBack} className="px-3 py-1 border border-gray-300 rounded-md">
              Back
            </button>
            <button type="button" onClick={goToNext} className="px-3 py-1 border border-gray-300 rounded-md">
              Next
            </button>
          </span>
          <span className="rbc-btn-group">
            <button
              type="button"
              onClick={() => toolbar.onView('month')}
              className={`px-3 py-1 border border-gray-300 rounded-md ${toolbar.view === 'month' ? 'bg-gray-200' : ''}`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => toolbar.onView('week')}
              className={`px-3 py-1 border border-gray-300 rounded-md ${toolbar.view === 'week' ? 'bg-gray-200' : ''}`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => toolbar.onView('day')}
              className={`px-3 py-1 border border-gray-300 rounded-md ${toolbar.view === 'day' ? 'bg-gray-200' : ''}`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => toolbar.onView('agenda')}
              className={`px-3 py-1 border border-gray-300 rounded-md ${toolbar.view === 'agenda' ? 'bg-gray-200' : ''}`}
            >
              Agenda
            </button>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Company Info, Work Days, Supervisors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white shadow-lg rounded-2xl p-10 flex items-center space-x-6 border border-gray-100 transform hover:scale-101 transition-all duration-300">
          <div className="w-32 h-32 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={`${companyName} logo`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-50">
                <span className="text-gray-400 font-medium">Logo</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{companyName || "Loading company..."}</h2>
            <p className="text-base text-gray-600 mt-2">{jobPosition || "Loading position..."}</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100 transform hover:scale-101 transition-all duration-300">
          <h3 className="text-xl font-bold mb-6 text-gray-900 text-center">Work Days</h3>          
          {workDays.length > 0 ? (
            <div className="space-y-4">
              {sortDaysOfWeek(workDays).map((day, index) => (
                <p key={index} className="text-gray-700 text-base">
                  <span className="font-semibold">{day.day_of_week}:</span> {day.start_time} - {day.end_time}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-base text-center">Loading work schedule...</p>
          )}
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100 transform hover:scale-101 transition-all duration-300">
          <h3 className="text-xl font-bold mb-6 text-gray-900 text-center">Supervisors</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <UserSquare2 size={32} color="#1e40af"/>
              <span className="font-semibold text-gray-800 text-base">Supervisor: Vincent Smith</span>
            </div>
            <div className="flex items-center gap-4">
              <UserSquare2 size={32} color="#1e40af"/>
              <span className="font-semibold text-gray-800 text-base">OJT Coordinator: John Doe</span>
            </div>           
          </div>
        </div>
      </div>

      {/* Calendar and Hours Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100 col-span-2 transform hover:scale-101 transition-all duration-300">
          <h3 className="text-xl font-bold mb-6 text-gray-900 text-center">Work Calendar</h3>
          <Calendar<Holiday> // Specify the event type as Holiday
            localizer={localizer}
            events={holidays}
            startAccessor="date"
            endAccessor="date"
            style={{ height: 500 }}
            className="bg-white rounded-xl shadow-inner"
            eventPropGetter={() => ({
              style: {
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '6px',
                padding: '4px 6px'
              }
            })}
            dayPropGetter={dayPropGetter}
            components={{
              toolbar: CustomToolbar,
            }}
          />
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100 transform hover:scale-101 transition-all duration-300">
          <h3 className="text-xl font-bold mb-4 text-gray-900 text-center">Hours Tracker</h3>
          <div className="space-y-5">
            <div>
              <p className="text-lg font-semibold text-gray-800 text-center">
                {totalHours !== null ? `${totalHours} hours remaining` : "Loading hours..."}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                placeholder="Enter hours worked"
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white text-gray-800 text-base shadow-sm"
                min="0"
                step="0.5"
              />
              <button
                onClick={handleHoursSubmit}
                className="bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Log
              </button>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="mt-6">
              <h4 className="text-base font-semibold text-gray-800 mb-4">Work Hours Log</h4>
              {logs.length > 0 ? (
                <div className="max-h-56 overflow-y-auto space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg shadow-sm">
                      <span>{log.hours} hours logged on {log.logged_at}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">No hours logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSide;