import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../supabase";
import { Loading } from "./Loading";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "student" | "admin";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "ok" | "deny">("loading");

  useEffect(() => {
    const check = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      const validEmail =
          user?.email?.endsWith("@neu.edu.ph") ||
          user?.email?.endsWith("@gmail.com");

      if (error || !user || !validEmail) {
        setStatus("deny");
        return;
      }

      if (!requiredRole) {
        setStatus("ok");
        return;
      }

      const { data } = await supabase
        .from("user")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const role: string = data?.role ?? "student";
      const isAdmin = role !== "student";

      if (requiredRole === "student" && !isAdmin) setStatus("ok");
      else if (requiredRole === "admin" && isAdmin) setStatus("ok");
      else setStatus("deny");
    };

    check();
  }, [requiredRole]);

  if (status === "loading") return <Loading />;
  if (status === "deny") return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
