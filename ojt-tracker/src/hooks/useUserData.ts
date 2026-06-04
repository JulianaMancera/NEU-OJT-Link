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

      const validEmail =
        user?.email?.endsWith("@neu.edu.ph") ||
        user?.email?.endsWith("@gmail.com");

      if (error || !user || !validEmail) {
        navigate("/"); // Redirect if there's an error or invalid email
        return;
      }

      const fullname = user.user_metadata?.full_name || "User";
      setUserName(fullname);

      const metadataRole = user.user_metadata?.role;

      const { data: existingUser } = await supabase
        .from("user")
        .select("user_id, role, profilePicture")
        .eq("user_id", user.id)
        .single();

      setUserRole(existingUser?.role || metadataRole || "student");

      if (existingUser?.profilePicture) {
        setProfilePicture(existingUser.profilePicture);
      } else {
        setProfilePicture(null);
      }

      // Insert user into DB if doesn't exist
      if (!existingUser) {
        const { error: insertError } = await supabase.from("user").insert({
          user_id: user.id,
          name: fullname,
          email: user.email,
          date_registered: new Date().toISOString(),
          course: null,
          role: metadataRole || "student"
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