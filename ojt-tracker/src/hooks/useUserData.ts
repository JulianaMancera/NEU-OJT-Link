import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";

export const useUserData = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("student");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user || !user.email?.endsWith("@neu.edu.ph")) {
        navigate("/");
        return;
      }

      const fullname = user.user_metadata?.full_name || "User";
      setUserName(fullname);
      setProfilePicture(user.user_metadata?.avatar_url || null);
      setUserRole(user.user_metadata?.role || "student");

      const { data: existingUser } = await supabase
        .from("user")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!existingUser) {
        const { error: insertError } = await supabase.from("user").insert({
          user_id: user.id,
          name: fullname,
          email: user.email,
          date_registered: new Date().toISOString(),
          course: null,
          profilePicture: user.user_metadata?.avatar_url,
        });

        if (insertError) {
          console.error("Error inserting user:", insertError);
        }
      }

      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  return { loading, userName, userRole, profilePicture };
}; 