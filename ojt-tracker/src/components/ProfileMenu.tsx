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
          message: 'Failed to load image'
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
    if (imageError) {
      console.log('Rendering fallback due to error:', imageError);
      return <User className={size === 'small' ? "w-6 h-6 text-blue-800" : "w-8 h-8 mx-auto text-white"} />;
    }

    if (profilePicture && isImageLoading) {
      return <User className={size === 'small' ? "w-6 h-6 text-blue-800" : "w-8 h-8 mx-auto text-white"} />;
    }

    if (profilePicture) {
      return (
        <img
          src={profilePicture}
          alt="Profile"
          className={size === 'small' ? "w-8 h-8 rounded-full object-cover" : "w-full h-full object-cover"}
          onLoad={() => {
            console.log('Profile image rendered in', size, 'view');
            setIsImageLoading(false);
            setImageError(null);
          }}
          onError={(e) => {
            console.error('Error rendering profile image in', size, 'view:', {
              url: profilePicture,
              error: e
            });
            setIsImageLoading(false);
            setImageError('Failed to render image');
          }}
        />
      );
    }

    return <User className={size === 'small' ? "w-6 h-6 text-blue-800" : "w-8 h-8 mx-auto text-white"} />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="relative p-2 hover:bg-violet-100 rounded-full transition-colors overflow-hidden"
      >
        {renderProfileImage('small')}
      </button>

      {isProfileOpen && (
        <div className="absolute right-6 top-20 bg-white text-gray-800 shadow-2xl rounded-xl w-80 z-50 animate-slide-down">
          <div className="bg-blue-800 text-white p-4 text-center">
            <div className="w-16 h-16 rounded-full mx-auto overflow-hidden mb-2">
              {renderProfileImage('large')}
            </div>
            <p className="font-semibold">{userName}</p>
            <p className="text-xs text-violet-200">{userRole}</p>
          </div>
          <ul className="text-sm">
            <li>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsProfileOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
              >
                <User className="w-4 h-4 mr-2" /> Profile
              </button>
            </li>
            <li>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </button>
            </li>
            <li>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
                <CircleHelp className="w-4 h-4 mr-2" /> Help & Support
              </button>
            </li>
            {userRole === "admin" && (
              <li>
                <button
                  onClick={() => {
                    navigate("/admin");
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
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
                className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}; 