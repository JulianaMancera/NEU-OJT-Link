import { useState, useEffect } from "react";
import { supabase } from '../../../supabase';
import OJTLogo from "/src/assets/ojt-white.png";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Define the type for the user object
type UserProfile = {
  id: string;
  email?: string;
  name: string;
  profilePicture?: string;
};

const StudentProfile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user")
        .select("name, profilePicture")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user:", error.message);
        return;
      }

      setUser({ ...user, ...data });
      setName(data?.name || "");
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.profilePicture) {
      const img = new Image();
      img.src = user.profilePicture;
      img.onload = () => {
        setIsImageLoading(false);
        setImageError(null);
      };
      img.onerror = () => {
        setIsImageLoading(false);
        setImageError("Failed to load profile picture.");
      };
    } else {
      setIsImageLoading(false);
    }
  }, [user?.profilePicture]);

  const updateName = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from("user")
      .update({ name })
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      console.error("Error updating name:", error.message);
      alert(`Failed to update name: ${error.message}`);
    } else {
      alert("Name updated successfully!");
      setUser((prev) => (prev ? { ...prev, name } : prev));
      navigate(-1); // Go back to the previous page
    }
  };

  const handleExit = () => {
    navigate(-1); // Go back to the previous page
  };

  const renderProfileImage = () => {
    if (imageError || !user?.profilePicture || isImageLoading) {
      return (
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4 border-2 border-gray-300">
          {isImageLoading ? (
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          ) : (
            <User className="w-12 h-12 text-gray-600" />
          )}
        </div>
      );
    }

    return (
      <img
        src={user.profilePicture}
        alt="Profile"
        className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-gray-300 object-cover"
      />
    );
  };

  return (
    <div className="relative min-h-screen w-screen bg-blue-100 p-6">
      {/* Header */}
      <div className="w-full h-[80px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-b border-black flex items-center justify-between px-6 z-50">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-3" />
      </div>

      <div className="max-w-md mx-auto mt-[100px] bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-3xl font-bold text-center text-black mb-6">PROFILE</h2>

        {renderProfileImage()}

        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
            Name:
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
            aria-label="Name"
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={updateName}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-blue-300 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Updating...
              </>
            ) : (
              "Update Name"
            )}
          </button>

          <button
            onClick={handleExit}
            className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
