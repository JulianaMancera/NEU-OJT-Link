import { useState } from "react";
import Sidebar from "../../components/SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
const Reports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen w-screen bg-blue-100">
     <div className="w-full h-[80px] absolute left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-1 border-black flex items-center justify-between px-6">
      <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
      </div>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
  

    </div>
   );
};

export default Reports;