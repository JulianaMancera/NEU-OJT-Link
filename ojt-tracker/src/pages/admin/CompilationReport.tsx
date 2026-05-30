import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import AdminLayout from "./AdminLayout";
import { Folder } from "lucide-react";

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
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [allBuckets, setAllBuckets] = useState<GroupedFilesByBucket>({});

  useEffect(() => {
    const getAllBuckets = async () => {
      const bucketFolderMap: { [bucket: string]: string } = {
        weekly_reports: "weekly_reports",
        "monthly-reports": "monthly_reports",
        journals: "weekly_journals",
        certificate: "cert",
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
              grouped[userId] = { userName: user?.name || "Unknown", files: [] };
            }
            grouped[userId].files.push({ name: file.name, url: urlData?.publicUrl || "#" });
          })
        );

        results[bucket] = grouped;
      }

      setAllBuckets(results);
    };

    getAllBuckets();
  }, []);

  const parseFileName = (filename: string) => filename.split("_")[0];

  const fetchBucketFiles = async (bucketName: string, folderName: string) => {
    const { data, error } = await supabase.storage.from(bucketName).list(folderName);
    if (error) {
      console.error(`Error fetching from ${bucketName}:`, error);
      return [];
    }
    return (data || []).filter((file) => file.name !== ".emptyFolderPlaceholder");
  };

  return (
    <AdminLayout>
      <div className="mt-24 bg-white border border-gray-200 rounded-xl p-8 max-w-7xl mx-auto text-gray-900 shadow-2xl">
        <h1 className="text-center font-bold text-4xl mb-8 text-gray-900">Compilation Report</h1>

        {/* Bucket selector */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {Object.keys(allBuckets).map((bucket) => (
            <button
              key={bucket}
              onClick={() => { setSelectedBucket(bucket); setSelectedUserId(null); }}
              className={`px-6 py-3 rounded-lg shadow-md transition-all duration-300 ${
                selectedBucket === bucket
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
            >
              {bucket.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>

        {/* User folder grid */}
        {selectedBucket && !selectedUserId && (
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
        )}

        {/* File list */}
        {selectedBucket && selectedUserId && (() => {
          const user = allBuckets[selectedBucket]?.[selectedUserId];
          return (
            <div className="p-6">
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-blue-600 hover:text-blue-800 font-medium mb-6 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        })()}

        {!selectedBucket && (
          <p className="text-center text-gray-500 text-lg">Select a report type to begin.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default CompilationReport;
