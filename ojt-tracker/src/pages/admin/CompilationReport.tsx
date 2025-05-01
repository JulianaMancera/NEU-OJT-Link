import { useEffect, useState } from "react";
import Sidebar from "../../components/SideBar";
import OJTLogo from "/src/assets/ojt-white.png";
import { supabase } from "../../../supabase";
import { Folder } from "lucide-react";

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
