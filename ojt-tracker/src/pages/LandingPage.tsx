import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import landingPic from "../assets/landingPic.png";
import ojt_logo from "../assets/ojt-logo.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user || !user.email?.endsWith("@neu.edu.ph")) {
        navigate("/"); // Redirect to login if not logged in
      } else {
        setUserName(user.user_metadata?.full_name || "User");
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex flex-col relative">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between p-8 relative z-10">
        {/* Left Side: Welcome Text */}
        <div className="lg:w-1/2 p-6">
          <h1 className="text-5xl font-bold text-gray-900">
            Welcome, {userName} to the <br />
            <span className="text-black">NEU OJT LINK</span>
          </h1>
          <p className="text-gray-600 mt-4 text-lg">
            Connecting students and companies seamlessly for a better OJT experience.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            Proceed to Dashboard
          </button>
        </div>

        {/* Right Side: Logo */}
        <div className="lg:w-1/2 flex justify-center">
          <img src={ojt_logo} alt="NEU OJT LINK Logo" className="relative -mt-[180px]" />
        </div>
      </div>

      {/* Bottom Section: Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={landingPic}
          alt="Presentation"
          className="w-full h-full object-cover opacity-80"
        />
      </div>
    </div>
  );
};

export default LandingPage;
