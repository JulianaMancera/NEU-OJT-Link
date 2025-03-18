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
    <div className="relative h-screen w-screen">
      {/* Background Image */}
      <img
        src={backgroundImage}
        alt="New Era University"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Google Sign-In Button (Right Aligned, No Text) */}
      
      <div className="relative w-full h-screen">
      <div className="w-[750px] h-full absolute right-0 top-0 bg-gradient-to-b from-[#7fb6dd] via-[#9fc8e6] to-white rounded-tl-[50px] rounded-bl-[50px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col items-center pt-24">
            <img
            src={backgroundImage1}
            alt="NEU LOGO"
           />

            <img
            src={backgroundImage2}
            alt="OJT LINK"
            className="obejct-contain relative -mt-[90px]"
            />

            <div className="flex flex-col items text-center relative -mt-[180px]">
              <h2 className="text-black text-[30px] font-semibold font-poppins">
              <p>Welcome User!</p>
              </h2>

              <div className="w-[230px] h-[50px] flex items-center justify-center">
                {!loading && (
                  <img
                  src={googleButton}
                  alt="Sign in with Google"
                  onClick={signInWithGoogle}
                  className="fixed top-[570px] center cursor-pointer transition-transform hover:scale-105 hover:shadow-lg justify-center"
                  />
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;