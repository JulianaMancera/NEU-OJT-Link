import React from "react";
import { Calendar, ClipboardList } from "lucide-react";

interface StudentSideProps {
  onViewChange: (view: "schedule" | "reports") => void;
  activeView: "schedule" | "reports";
  onToggleBlur: (isBlurred: boolean) => void;
  isSidebarOpen: boolean;
  onSidebarClick: () => void;
  onCloseSidebar: () => void; // New prop to close the sidebar
}

const StudentSide: React.FC<StudentSideProps> = ({ onViewChange, activeView, onToggleBlur, isSidebarOpen, onSidebarClick, onCloseSidebar }) => {
  const handleScheduleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    console.log("Schedule button clicked, activeView before:", activeView);
    onViewChange("schedule");
    onCloseSidebar(); // Close the sidebar on button click
    console.log("Schedule button clicked, activeView after:", activeView);
  };

  const handleReportsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    console.log("Reports button clicked, activeView before:", activeView);
    onViewChange("reports");
    onCloseSidebar(); // Close the sidebar on button click
    console.log("Reports button clicked, activeView after:", activeView);
  };

  // Trigger blur when sidebar is opened, remove when closed
  React.useEffect(() => {
    if (isSidebarOpen) {
      onToggleBlur(true);
    } else {
      onToggleBlur(false);
    }
  }, [isSidebarOpen, onToggleBlur]);

  return (
    <div className="h-full w-64 bg-gray-100 z-40" onClick={onSidebarClick}>
      <div className="space-y-4 p-4 pt-14">
        {/* Sidebar Buttons */}
        <button
          onClick={handleScheduleClick}
          className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 font-semibold cursor-pointer min-h-[55px] z-50 ${
            activeView === "schedule"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          <Calendar className="mr-3 flex-shrink-0 min-w-[24px]" />
          <span className="flex-1 text-left">Schedule</span>
        </button>
        <button
          onClick={handleReportsClick}
          className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 font-semibold cursor-pointer min-h-[55px] z-50 ${
            activeView === "reports"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          <ClipboardList className="mr-3 flex-shrink-0 min-w-[24px]" />
          <span className="flex-1 text-left">Reports</span>
        </button>
      </div>
    </div>
  );
};

export default StudentSide;