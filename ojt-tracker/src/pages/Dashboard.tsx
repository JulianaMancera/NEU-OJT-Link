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
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error||!user || !user.email?.endsWith("@neu.edu.ph")) {
        navigate("/"); // ✅ Redirect to login if not logged in
      }else{
      const fullname = user.user_metadata?.full_name || "User";
      const {error } = await supabase.from("user").insert({
          user_id: user.id,
          name: fullname,
          email: user.email,
          date_registered: new Date().toISOString(),
          course: null
        })
        if(error) console.error("Error here", error)
        console.log("The User Creation was success")

      setUser(user);
      setLoading(false);
 
      }
      
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
      {user && <p className="mt-4">Logged in as: {user.user_metadata?.full_name}</p>}
    </div>
  );
};

export default Dashboard;
