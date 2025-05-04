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
      navigate("/");
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
        "certificate": "cert"
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
        className={`px-6 py-3 rounded-lg shadow-md transition-all duration-300 ${
          selectedBucket === bucket
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-white text-gray-800 hover:bg-gray-100"
        }`}
      >
        {bucket.replace("_", " ").toUpperCase()}
      </button>
    ));

  const renderUserFolders = () => {
    if (!selectedBucket) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {Object.entries(allBuckets[selectedBucket] || {}).map(([userId, { userName }]) => (
          <div
            key={userId}
            onClick={() => setSelectedUserId(userId)}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 flex items-center space-x-4"
          >
            <Folder className="w-10 h-10 text-blue-500" />
            <div>
              <p className="text-lg font-medium text-gray-900">{userName}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFileList = () => {
    if (!selectedBucket || !selectedUserId) return null;

    const user = allBuckets[selectedBucket]?.[selectedUserId];

    return (
      <div className="p-6">
        <button
          onClick={() => setSelectedUserId(null)}
          className="text-blue-600 hover:text-blue-800 font-medium mb-6 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to users
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">{user?.userName}'s Files</h2>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">File Name</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {user?.files.map((file, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-4 text-gray-800 flex items-center">
                    <span className="text-gray-500 mr-2">📄</span>
                    {file.name}
                    <span className="text-gray-500 ml-2">(PDF)</span>
                  </td>
                  <td className="p-4">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {user?.files.length === 0 && (
            <p className="p-4 text-center text-gray-500">No files available.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-screen bg-gradient-to-b from-[#4F74C9] to-[#0A279C] p-4 text-white">
      {/* Header */}
      <div className="w-screen h-[79px] fixed left-0 top-0 bg-gradient-to-b from-[#578FCA] to-[#2B4764] border-b border-gray-800 flex items-center justify-between px-6 z-10 shadow-lg">
        <img src={OJTLogo} alt="OJT Link Logo" className="w-[220px] h-[220px] ml-15" />
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setProfileOpen(!isProfileOpen)}
            className="relative p-2 hover:bg-blue-700 rounded-full transition-all duration-300"
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-6 top-16 bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden z-50 w-64 animate-slide-in-down">
              <div className="bg-blue-800 text-white p-4 text-center">
                <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border-4 border-blue-200">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 mx-auto text-white" />
                  )}
                </div>
                <p className="font-semibold text-lg mt-2">{userName}</p>
                <p className="text-sm text-blue-100 capitalize">{userRole}</p>
              </div>
              <ul className="text-sm">
                <li>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center transition-all duration-200"
                  >
                    <User className="w-5 h-5 mr-3" /> Profile
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center transition-all duration-200">
                    <Settings className="w-5 h-5 mr-3" /> Settings
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center transition-all duration-200">
                    <CircleHelp className="w-5 h-5 mr-3" /> Help & Support
                  </button>
                </li>
                {userRole === "admin" && (
                  <li>
                    <button
                      onClick={() => navigate("/admin")}
                      className="w-full text-left px-6 py-3 hover:bg-gray-100 flex items-center transition-all duration-200"
                    >
                      <UserCog className="w-5 h-5 mr-3" /> Admin
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-6 py-3 hover:bg-red-50 text-red-600 flex items-center transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5 mr-3" /> Log out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="mt-24 bg-white border border-gray-200 rounded-xl p-8 max-w-7xl mx-auto text-gray-900 shadow-2xl">
        <h1 className="text-center font-bold text-4xl mb-8 text-black-900">Compilation Report</h1>

        {/* Bucket Selector */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {renderBucketButtons()}
        </div>

        {/* View */}
        {selectedBucket && !selectedUserId ? renderUserFolders() : renderFileList() || (
          <p className="text-center text-gray-500 text-lg">Select a report type to begin.</p>
        )}
      </div>
    </div>
  );
};

export default CompilationReport;