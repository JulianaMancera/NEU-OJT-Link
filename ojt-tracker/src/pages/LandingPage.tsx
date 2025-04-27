import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import landingPic from "../assets/landingPic.png";
import "/src/Transition.css"; 

const LandingPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
  
      if (error || !user || !user.email?.endsWith("@neu.edu.ph")) {
        navigate("/"); // Redirect to login if not logged in
      } else {
        // Use the full name if available, otherwise use the email username
        const fullName = user.user_metadata?.full_name || "";
        const emailUsername = user.email ? user.email.split('@')[0] : "";
        
        // Choose the most appropriate display name, prioritizing full name
        const displayName = fullName || emailUsername || "User";
        
        setUserName(displayName);
        localStorage.setItem("lastLoggedInUser", displayName);
      }
    };
  
    fetchUser();
  }, [navigate]);

  return (
    <div className="min-h-screen w-screen overflow-hidden relative flex flex-col items-center justify-center">
    {/* Background Image */}
    <div className="absolute inset-0 w-full h-full -z-10">
      <img
        src={landingPic}
        alt="Students"
        className="w-full h-full object-cover"
      />
    </div>
      {/* Content */}
      <div className="max-w-7xl mx-auto h-full flex flex-col lg:flex-row items-center justify-center relative z-15 -top-75">
       
        {/* Left Column */}
        <div className="lg:w-1/2 space-y-4 animate-fade-in text-center lg:text-left animate-slide-in-left">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-2xl font-bold text-black leading-tight">
              Welcome,
              <span className="block text-black/80">{userName}</span>
            </h1>
            <h2 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-black to-black/80 bg-clip-text text-transparent">
              to the NEU OJT LINK
            </h2>
          </div>
          
          <div className="h-1 w-40 bg-black/50 rounded-full my-5"></div>
          
          <p className="text-xl text-black/80 max-w-xl">
            Connecting students and companies seamlessly for a better OJT experience.
          </p>
        </div>

        {/* Right Column */}
        <div className="lg:w-1/2 mt-9 lg:mt-0 flex justify-center lg:justify-end animate-fade-in animate-slide-in-right">
          <div className="glass-card p-8 w-full max-w-md bg-white/70">
            <h3 className="text-2xl font-medium text-gray-800 mb-6">Ready to explore opportunities?</h3>
            <p className="text-gray-600 mb-8">
              Find your perfect OJT match from our curated selection of partner companies.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-black btn-neu w-full flex items-center justify-center group"
            >
              <span>Proceed to Dashboard</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;