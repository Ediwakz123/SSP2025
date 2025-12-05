import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../../lib/supabase";
import { Clock, AlertTriangle, XCircle, LogOut, MapPin } from "lucide-react";
import { Button } from "../ui/button";

type ApprovalStatus = "pending" | "approved" | "declined" | "flagged" | null;

function StatusPage({
  icon: Icon,
  iconColor,
  bgColor,
  title,
  message,
  submessage
}: {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  title: string;
  message: string;
  submessage?: string;
}) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className={`mx-auto w-20 h-20 ${bgColor} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
          <Icon className={`w-10 h-10 ${iconColor}`} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 mb-2">{message}</p>
        {submessage && (
          <p className="text-sm text-gray-500 mb-6">{submessage}</p>
        )}

        <Button
          variant="outline"
          onClick={handleLogout}
          className="mt-4"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    async function checkApproval() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("approval_status")
          .eq("id", user!.id)
          .single();

        if (error) {
          console.error("Error checking approval status:", error);
          // If profile doesn't exist yet (race condition), treat as pending
          setApprovalStatus("pending");
        } else {
          setApprovalStatus(data?.approval_status as ApprovalStatus ?? "pending");
        }
      } catch (err) {
        console.error("Error checking approval:", err);
        setApprovalStatus("pending");
      }
      setChecking(false);
    }

    checkApproval();
  }, [user]);

  // ⏳ Wait for Supabase AND approval check
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Checking session...</p>
        </div>
      </div>
    );
  }

  // ❌ No valid user → go to login
  if (!user) return <Navigate to="/user/login" replace />;

  // ⏳ Pending approval
  if (approvalStatus === "pending") {
    return (
      <StatusPage
        icon={Clock}
        iconColor="text-amber-600"
        bgColor="bg-amber-100"
        title="Account Pending Approval"
        message="Your registration is being reviewed by our administrators."
        submessage="You'll receive access once your account is approved. This typically takes 1-2 business days."
      />
    );
  }

  // 🚩 Flagged (outside location)
  if (approvalStatus === "flagged") {
    return (
      <StatusPage
        icon={MapPin}
        iconColor="text-orange-600"
        bgColor="bg-orange-100"
        title="Account Under Review"
        message="Your account is temporarily blocked. We are running additional checks."
        submessage="Your address appears to be outside our service area (Sta. Cruz, Santa Maria, Bulacan). An administrator will review your account."
      />
    );
  }

  // ❌ Declined
  if (approvalStatus === "declined") {
    return (
      <StatusPage
        icon={XCircle}
        iconColor="text-red-600"
        bgColor="bg-red-100"
        title="Account Access Denied"
        message="Unfortunately, your account request has been declined."
        submessage="If you believe this is an error, please contact the administrator."
      />
    );
  }

  // ✔ User is authenticated and approved
  return children;
}
