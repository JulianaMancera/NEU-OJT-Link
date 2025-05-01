import { User, Settings, CircleHelp, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProfileMenuProps {
  userName: string;
  userRole: string;
  profilePicture: string | null;
  onLogout: () => void;
}

export const ProfileMenu = ({ userName, userRole, profilePicture, onLogout }: ProfileMenuProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProfileMenu received profilePicture:', profilePicture);
    setImageError(null);

    if (profilePicture) {
      // Preload the image
      const img = new Image();
      img.src = profilePicture;

      img.onload = () => {
        console.log('Profile image loaded successfully:', profilePicture);
        setIsImageLoading(false);
        setImageError(null);
      };

      img.onerror = (error) => {
        console.error('Error loading profile image:', {
          url: profilePicture,
          error: error,
          message: 'Failed to load image',
        });
        setIsImageLoading(false);
        setImageError('Failed to load image');
      };
    } else {
      console.log('No profile picture provided');
      setIsImageLoading(false);
    }
  }, [profilePicture]);

  const renderProfileImage = (size: 'small' | 'large') => {
    if (imageError || !profilePicture || isImageLoading) {
      return (
        <div className={size === 'small' ? "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center" : "w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto"}>
          <User className={size === 'small' ? "w-6 h-6 text-blue-800" : "w-12 h-12 text-white"} />
        </div>
      );
    }

    return (
      <img
        src={profilePicture}
        alt="Profile"
        className={size === 'small' ? "w-8 h-8 rounded-full object-cover border-2 border-blue-300" : "w-24 h-24 rounded-full object-cover border-4 border-blue-300"}
      />
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="relative p-3 hover:bg-blue-800 rounded-full transition-all duration-300"
      >
        {renderProfileImage('small')}
      </button>

      {isProfileOpen && (
        <div className="absolute right-6 top-[4.5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem] animate-slide-in-down">
          <div className="bg-blue-800 text-white p-4 text-center">
            <div className="w-24 h-24 rounded-full mx-auto overflow-hidden mb-3">
              {renderProfileImage('large')}
            </div>
            <p className="font-semibold text-xl">{userName}</p>
            <p className="text-sm text-blue-200 capitalize">{userRole}</p>
          </div>
          <ul className="text-sm">
            <li>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
              >
                <User className="w-6 h-6 mr-3" /> Profile
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
              >
                <Settings className="w-6 h-6 mr-3" /> Settings
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
              >
                <CircleHelp className="w-6 h-6 mr-3" /> Help & Support
              </button>
            </li>
            {userRole === "admin" && (
              <li>
                <button
                  onClick={() => {
                    navigate("/admin");
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                >
                  🛠️ Admin
                </button>
              </li>
            )}
            <li>
              <button
                onClick={() => {
                  onLogout();
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-6 py-4 hover:bg-red-50 text-red-600 flex items-center transition-all duration-200"
              >
                <LogOut className="w-6 h-6 mr-3" /> Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};