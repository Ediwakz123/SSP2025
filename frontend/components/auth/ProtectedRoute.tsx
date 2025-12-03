import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  // ⏳ Wait for Supabase to finish restoring session
  if (loading) return <div className="p-4">Checking session...</div>;

  // ❌ No valid user → go to login
  if (!user) return <Navigate to="/user/login" replace />;

  // ✔ User is authenticated
  return children;
}
