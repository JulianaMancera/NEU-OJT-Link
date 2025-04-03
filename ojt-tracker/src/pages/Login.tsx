import { supabase } from "../../supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "/src/assets/School.png"; // Background Image
import backgroundImage1 from "/src/assets/neu-logo.png"; // NEU Logo
import backgroundImage2 from "/src/assets/ojt-logo.png"; // OJT Logo
import googleButton from "/src/assets/google-button.png"; // Google Sign-In Button Image
import "/src/Login.css";

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
    <div className="login-container">
      {/* Background Image */}
      <img src={backgroundImage} alt="New Era University" className="background-img" />

      {/* Login Box */}
      <div className="login-box">
        <img src={backgroundImage1} alt="NEU LOGO" className="neu-logo" />
        <img src={backgroundImage2} alt="OJT LINK" className="ojt-logo" />

        <div className="text-container">
          <h2 className="welcome-text">Welcome User!</h2>

          {/* Google Sign-In Button */}
          <div className="google-button-container">
            {!loading && (
              <img
                src={googleButton}
                alt="Sign in with Google"
                onClick={signInWithGoogle}
                className="google-button"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
