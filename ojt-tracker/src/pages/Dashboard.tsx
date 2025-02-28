import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email?.endsWith("@neu.edu.ph")) {
        navigate("/"); // ✅ Redirect to login if not logged in
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/"); // ✅ Redirects to login after logout
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
        <div>
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
            onClick={() => navigate("/companies")}
          >
            View Companies
          </button>
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
            onClick={() => navigate("/weekly-report")}
          >
            Submit Weekly Report
          </button>
          <button 
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
      {user && <p className="mt-4">Logged in as: {user.email}</p>}
    </div>
  );
};

export default Dashboard;
