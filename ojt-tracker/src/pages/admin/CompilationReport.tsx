import { useEffect, useState } from "react";
import Sidebar from "./SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { supabase } from "../../../supabase";
import { Folder, User, Settings, CircleHelp, LogOut, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Types
type FileItem = {
  name: string;
  url: string;
};

type GroupedFiles = {
  [userId: string]: {
    userName: string;
    files: FileItem[];
  };
};

type GroupedFilesByBucket = {
  [bucketName: string]: GroupedFiles;
};

const CompilationReport = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [allBuckets, setAllBuckets] = useState<GroupedFilesByBucket>({});
  const [isProfileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Placeholder user data (replace with actual auth data from Supabase)
  const [userName, setUserName] = useState<string>("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user")
          .select("name, role, profilePicture")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setUserName(data.name || "Unknown");
          setUserRole(data.role || "user");
          setProfilePicture(data.profilePicture);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const getAllBuckets = async () => {
      const bucketFolderMap: { [bucket: string]: string } = {
        "weekly_reports": "weekly_reports",
        "monthly-reports": "monthly_reports",
        "journals": "weekly_journals",
      };

      const results: GroupedFilesByBucket = {};

      for (const [bucket, folder] of Object.entries(bucketFolderMap)) {
        const files = await fetchBucketFiles(bucket, folder);

        const grouped: GroupedFiles = {};

        await Promise.all(
          files.map(async (file) => {
            const userId = parseFileName(file.name);

            const { data: user } = await supabase
              .from("user")
              .select("name")
              .eq("user_id", userId)
              .single();

            const filePath = `${folder}/${file.name}`;
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

            if (!grouped[userId]) {
              grouped[userId] = {
                userName: user?.name || "Unknown",
                files: [],
              };
            }

            grouped[userId].files.push({
              name: file.name,
              url: urlData?.publicUrl || "#",
            });
          })
        );

        results[bucket] = grouped;
      }

      setAllBuckets(results);
    };

    getAllBuckets();
  }, []);

  const parseFileName = (filename: string) => {
    return filename.split("_")[0];
  };

  const fetchBucketFiles = async (bucketName: string, folderName: string) => {
    const { data, error } = await supabase.storage.from(bucketName).list(folderName);
    if (error) {
      console.error(`Error fetching from ${bucketName}:`, error);
      return [];
    }
    return (data || []).filter((file) => file.name !== ".emptyFolderPlaceholder");
  };

  const renderBucketButtons = () =>
    Object.keys(allBuckets).map((bucket) => (
      <button
        key={bucket}
        onClick={() => {
          setSelectedBucket(bucket);
          setSelectedUserId(null);
        }}
        className={`px-4 py-2 rounded ${
          selectedBucket === bucket
            ? "bg-blue-700 text-white"
            : "bg-white text-black border"
        }`}
      >
        {bucket.replace("_", " ").toUpperCase()}
      </button>
    ));

  const renderUserFolders = () => {
    if (!selectedBucket) return null;
    return (
      <div className="grid grid-cols-6 gap-4 p-4">
        {Object.entries(allBuckets[selectedBucket] || {}).map(
          ([userId, { userName }]) => (
            <div
              key={userId}
              onClick={() => setSelectedUserId(userId)}
              className="text-center cursor-pointer hover:bg-gray-100 p-2 rounded"
            >
              <Folder className="w-16 h-16 mx-auto text-gray-600" />
              <p className="mt-2 text-sm font-medium">{userName}</p>
            </div>
          )
        )}
      </div>
    );
  };

  const renderFileList = () => {
    if (!selectedBucket || !selectedUserId) return null;

    const user = allBuckets[selectedBucket]?.[selectedUserId];

    return (
      <>
        <button
          onClick={() => setSelectedUserId(null)}
          className="text-blue-600 underline mb-4"
        >
          ← Back to users
        </button>

        <h2 className="text-2xl font-semibold mb-4">{user?.userName}'s Files</h2>

        <ul className="list-disc list-inside space-y-2">
          {user?.files.map((file, idx) => (
            <li key={idx} className="text-sm text-gray-800 flex items-center space-x-2">
              <span className="text-gray-600">📄</span>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                {file.name}
              </a>
              {/* Add a PDF icon next to the file name */}
              <span className="text-gray-500"> (PDF)</span>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#4F74C9] to-[#0A279C] p-8">
      {/* Header */}
      <div className="w-screen h-[79px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-b border-black flex items-center justify-between px-6 z-10">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[219px] h-[220px] ml-15" />
        <div className="flex items-center">
          <button
            onClick={() => setProfileOpen(!isProfileOpen)}
            className="relative p-3 hover:bg-blue-800 rounded-full transition-all duration-300"
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-6 top-[4.5rem] bg-white text-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-64 min-w-[16rem] animate-slide-in-down">
              <div className="bg-blue-800 text-white p-4 text-center">
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden mb-3 border-4 border-blue-300">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 mx-auto text-white" />
                  )}
                </div>
                <p className="font-semibold text-xl">{userName}</p>
                <p className="text-sm text-blue-200 capitalize">{userRole}</p>
              </div>
              <ul className="text-sm">
                <li>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                  >
                    <User className="w-6 h-6 mr-3" /> Profile
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                    <Settings className="w-6 h-6 mr-3" /> Settings
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200">
                    <CircleHelp className="w-6 h-6 mr-3" /> Help & Support
                  </button>
                </li>
                {userRole === "admin" && (
                  <li>
                  <button
                    onClick={() => navigate("/admin")}
                    className="w-full text-left px-6 py-4 hover:bg-gray-100 flex items-center transition-all duration-200"
                  >
                    <UserCog className="w-6 h-6 mr-3" /> Admin
                  </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-6 py-4 hover:bg-red-50 text-red-600 flex items-center transition-all duration-200"
                  >
                    <LogOut className="w-6 h-6 mr-3" /> Log out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="mt-24 bg-[#FFFCF9] border border-black rounded-lg p-6 max-w-8xl mx-auto text-black">
        <h1 className="text-center font-bold text-5xl mb-6">Compilation Report</h1>

        {/* Bucket Selector */}
        <div className="flex gap-4 mb-6">{renderBucketButtons()}</div>

        {/* View */}
        {selectedBucket && !selectedUserId
          ? renderUserFolders()
          : renderFileList() || <p>Select a report type to begin.</p>}
      </div>
    </div>
  );
};

export default CompilationReport;