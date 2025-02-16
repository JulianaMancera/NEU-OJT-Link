import { supabase } from "../../supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Auth.module.css"; // ✅ Import CSS Module
import universityImage from "../assets/new-era-university.jpg"; // ✅ Import Image
import googleLogo from "../assets/google-logo.jpg"; // ✅ Import the Google Logo

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
    <div className={styles.container}>
      {/* Left Side - Image */}
      <div className={styles.imageContainer}>
        <img src={universityImage} alt="New Era University" className={styles.image} />
      </div>

      {/* Right Side - Login Section */}
      <div className={styles.loginContainer}>
        <h1 className={styles.title}>NEU OJT LINK</h1>
        <p className={styles.subtitle}>Welcome, User!</p>
        {!loading && (
          <button onClick={signInWithGoogle} className={styles.googleButton}>
          <img src={googleLogo} alt="Google Logo" className={styles.googleIcon} />
          <span>Sign in with Google</span>
        </button>
        
        
        
        )}
      </div>
    </div>
  );
};

export default Auth;
