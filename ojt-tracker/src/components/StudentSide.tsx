import React from "react";
import { FileText } from "lucide-react";

interface StudentSideProps {
  onViewChange: (view: "schedule" | "reports") => void;
  activeView: "schedule" | "reports";
}

const StudentSide: React.FC<StudentSideProps> = ({ onViewChange, activeView }) => {
  const handleScheduleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    console.log("Schedule button clicked, activeView before:", activeView);
    onViewChange("schedule");
    console.log("Schedule button clicked, activeView after:", activeView);
  };

  const handleReportsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    console.log("Reports button clicked, activeView before:", activeView);
    onViewChange("reports");
    console.log("Reports button clicked, activeView after:", activeView);
  };

  return (
    <div className="h-full w-64 bg-gray-100 z-10">
      <div className="space-y-4 p-4 pt-14">
        {/* Sidebar Buttons */}
        <button
          onClick={handleScheduleClick}
          className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 font-semibold cursor-pointer min-h-[55px] z-10 ${
            activeView === "schedule"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          <FileText className="mr-3 flex-shrink-0 min-w-[24px]" />
          <span className="flex-1 text-left">Schedule</span>
        </button>
        <button
          onClick={handleReportsClick}
          className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 font-semibold cursor-pointer min-h-[55px] z-10 ${
            activeView === "reports"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          <FileText className="mr-3 flex-shrink-0 min-w-[24px]" />
          <span className="flex-1 text-left">Reports</span>
        </button>
      </div>
    </div>
  );
};

export default StudentSide;