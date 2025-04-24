import { useState, useEffect } from "react";
import { supabase } from '../../../supabase';


const StudentProfile = () => {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

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
        console.error("Error fetching user:", error);
        return;
      }

      setUser({ ...user, ...data });
      setName(data?.name || "");
    };

    fetchUser();
  }, []);

  const updateName = async () => {
    if (!user) return;
    
    setLoading(true);

    const { error } = await supabase
      .from("user")
      .update({ name })
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      console.error("Error updating name:", error);
      alert("Failed to update name.");
    } else {
      alert("Name updated successfully!");
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center" style={{ backgroundColor: '#D0E8FF' }}>
      <div className="max-w-lg w-full mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Profile</h2>
  
        {user?.profilePicture && (
          <img
            src={user.profilePicture}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
        )}
  
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Name:
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-gray-950 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
  
        <button
          onClick={updateName}
          className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          disabled={loading}
        >
          Update Name
        </button>
      </div>
    </div>
  );
  
};

export default StudentProfile;
