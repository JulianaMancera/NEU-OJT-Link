import { supabase } from "../../supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/login-page.png"; // Background Image
import googleButton from "../assets/google-button.png"; // Your Google Sign-In Button Image

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email?.endsWith("@neu.edu.ph")) {
        navigate("/dashboard");
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
      options: { redirectTo: window.location.origin + "/dashboard" },
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
      <div className="absolute top-[75%] right-[15%] transform -translate-y-1/2">
        {!loading && (
          <img
            src={googleButton}
            alt="Sign in with Google"
            onClick={signInWithGoogle}
            className="cursor-pointer transition-transform transform hover:scale-105 hover:shadow-lg"
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
