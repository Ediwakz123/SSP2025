import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../../lib/supabase";

interface Props {
  children: JSX.Element;
  role: "admin" | "user";
}

export function RoleProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    const userId = user.id;

    async function loadRole() {
      const table = role === "admin" ? "admin_profiles" : "profiles";

      const { data } = await supabase
        .from(table)
        .select("role")
        .eq("id", userId)
        .single();

      setUserRole(data?.role ?? null);
      setChecking(false);
    }

    loadRole();
  }, [user, role]);

  // ⏳ Wait for Supabase AND role lookup
  if (loading || checking) return <div className="p-4">Checking permissions...</div>;

  // ❌ Not logged in
  if (!user) {
    return role === "admin"
      ? <Navigate to="/admin/login" replace />
      : <Navigate to="/user/login" replace />;
  }

  // ❌ Wrong role
  if (role !== userRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
