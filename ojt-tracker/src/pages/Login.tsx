import { supabase } from "../../supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import universityImage from "../assets/new-era-university.jpg";
import googleLogo from "../assets/google-logo.jpg";


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
    <div className="flex h-screen w-full bg-gray-100">
      {/* Left Side - Image */}
      <div className="flex-1">
        <img
          src={universityImage}
          alt="New Era University"
          className="min-w min-h-screen object-cover"
        />
      </div>

      {/* Right Side - Login Section */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white p-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">NEU OJT LINK</h1>
        <p className="text-lg text-gray-600 mb-6">Welcome, User!</p>
        {!loading && (
          <button
            onClick={signInWithGoogle}
            className="flex items-center px-6 py-3 border rounded-lg shadow-md bg-white hover:bg-gray-100 transition"
          >
            <img src={googleLogo} alt="Google Logo" className="w-6 h-6 mr-1" />
            <span className="text-gray-700 font-medium text-lg">Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Auth;
