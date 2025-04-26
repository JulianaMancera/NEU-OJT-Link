import { User, Settings, CircleHelp, LogOut } from "lucide-react";

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
  profilePicture: string | null;
  onLogout: () => void;
}

export const ProfileMenu = ({ isOpen, userName, userRole, profilePicture, onLogout }: ProfileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-16 bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem]">
      <div className="bg-blue-800 text-white p-4 text-center">
        <div className="w-16 h-16 rounded-full mx-auto overflow-hidden mb-2">
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 mx-auto text-white" />
          )}
        </div>
        <p className="font-semibold">{userName}</p>
        <p className="text-xs text-violet-200">{userRole}</p>
      </div>
      <ul className="text-sm">
        <li>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
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
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center">
              🛠️ Admin
            </button>
          </li>
        )}
        <li>
          <button onClick={onLogout} className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 flex items-center">
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </button>
        </li>
      </ul>
    </div>
  );
}; 