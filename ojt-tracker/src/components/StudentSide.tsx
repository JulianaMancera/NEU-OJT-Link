import React from "react";
import { FileText } from "lucide-react";

interface StudentSideProps {
  onViewChange: (view: "schedule" | "reports") => void;
  activeView: "schedule" | "reports";
}

const StudentSide: React.FC<StudentSideProps> = ({ onViewChange, activeView }) => {
  return (
    <div className="space-y-4">
      {/* Sidebar Buttons */}
      <button
        onClick={() => onViewChange("schedule")}
        className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 font-semibold ${
          activeView === "schedule"
            ? "bg-blue-600 text-white"
            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
        }`}
      >
        <FileText className="mr-3" />
        Schedule
      </button>
      <button
        onClick={() => onViewChange("reports")}
        className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 font-semibold ${
          activeView === "reports"
            ? "bg-blue-600 text-white"
            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
        }`}
      >
        <FileText className="mr-3" />
        Reports
      </button>
    </div>
  );
};

export default StudentSide;