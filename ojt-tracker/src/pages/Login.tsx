import { supabase } from "../../supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "/src/assets/School.png"; // Background Image
import backgroundImage1 from "/src/assets/neu-logo.png"; // NEU Logo
import backgroundImage2 from "/src/assets/ojt-logo.png"; // OJT Logo
import googleButton from "/src/assets/google-button.png"; // Your Google Sign-In Button Image


const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email?.endsWith("@neu.edu.ph")) {
        navigate("/landing-page");
      } else {
        await supabase.auth.signOut();
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/landing-page" },
    });

    if (error) console.error("Google Sign-In Error:", error);
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
   
      <img
        src={backgroundImage}
        alt="New Era University"
        className="absolute w-full h-full object-cover"
        style={{ left: "-13%",
         }}
      />
    
      <div className="relative w-full h-screen flex items-center justify-end">
        <div className="md:w-[42vw] h-full absolute md:static right-0 top-0 bg-gradient-to-b from-[#7fb6dd] via-[#9fc8e6] to-white rounded-tl-[50px] rounded-bl-[50px] shadow-lg p-6 flex flex-col items-center">
        
        
          <img src={backgroundImage1} 
          alt="NEU LOGO" 
          className="w-32 md:w-[8vw] mt-10 md:mt-23 animate-slide-in-up" />

          <img
            src={backgroundImage2}
            alt="OJT LINK"
            className="object-contain relative md:-mt-[110px] w-48 md:w-[27vw] animate-slide-in-up"
          />

        

          <div className="flex flex-col text-center relative md:-mt-[9.5vw]">
            <h2 className="text-black md:text-[37px] font-semibold font-poppins animate-slide-in-up2">
              Welcome User!
            </h2>

            {/* Google Sign-In Button */}

            <div className="w-[180px] md:w-[280px] h-[100px] flex items-center justify-center animate-slide-in-up2">

              {!loading && (
                <img
                  src={googleButton}
                  alt="Sign in with Google"
                  onClick={signInWithGoogle}
                  className="cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
                />
              )}
        </div>
      </div>
            <p className="!text-black h-15 md:text-[15px] font-semibold mt-50 animate-slide-in-up3" style={{ fontFamily: 'Arial'}}>NEU OJT-LINK | Juliana Renard DL Vince Alyssa © 2025 · All rights reserved</p>
    </div>
  </div>
</div>

  );
};

export default Auth;