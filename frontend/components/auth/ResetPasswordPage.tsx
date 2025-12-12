// 🟩 ResetPasswordPage.tsx (FINAL PASSWORD SET)

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { validatePassword, validatePasswordMatch } from "../../utils/validation";

// Field error display component
function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1 animate-fadeIn">
      <AlertCircle className="w-3 h-3" />
      {error}
    </p>
  );
}

// Field success display component
function FieldSuccess({ message }: { message: string }) {
  return (
    <p className="text-xs text-green-500 mt-1 flex items-center gap-1 animate-fadeIn">
      <Check className="w-3 h-3" />
      {message}
    </p>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  
  // Field-level validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        toast.error("You must verify the code first.");
        navigate("/forgot-password");
      }
    });
  }, [navigate]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === "newPassword") {
      const result = validatePassword(newPassword);
      setFieldErrors(prev => ({ ...prev, newPassword: result.error || "" }));
    } else if (field === "confirm") {
      const result = validatePasswordMatch(newPassword, confirm);
      setFieldErrors(prev => ({ ...prev, confirm: result.error || "" }));
    }
  }, [newPassword, confirm]);

  // Check if field is valid for success indicator
  const isFieldValid = (field: string): boolean => {
    if (!touched[field]) return false;
    if (field === "newPassword") return validatePassword(newPassword).isValid;
    if (field === "confirm") return validatePasswordMatch(newPassword, confirm).isValid && confirm.length > 0;
    return false;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const passwordResult = validatePassword(newPassword);
    const matchResult = validatePasswordMatch(newPassword, confirm);
    
    const errors: Record<string, string> = {};
    if (!passwordResult.isValid) errors.newPassword = passwordResult.error || "";
    if (!matchResult.isValid) errors.confirm = matchResult.error || "";
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({ newPassword: true, confirm: true });
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset successfully!");
      setIsReset(true);
    }

    setLoading(false);
  };

  if (isReset) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-emerald-50/30 p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md animate-fadeInUp">
          <Card className="bg-white/90 backdrop-blur-xl border-gray-100/80 shadow-2xl shadow-gray-900/10 rounded-3xl">
          <CardHeader className="text-center space-y-4 pb-4">
            <div className="mx-auto relative w-16 h-16 bg-linear-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
              <div className="absolute -inset-1 bg-linear-to-br from-emerald-500 to-green-600 rounded-2xl blur opacity-30 -z-10" />
            </div>

            <CardTitle className="text-2xl font-bold text-gray-900">Password Reset</CardTitle>
            <CardDescription className="text-gray-500">Your password has been updated successfully.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <Button variant="gradient" className="w-full h-12" onClick={() => navigate("/user/login")}>
              Go to Login
            </Button>
            <p className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
              Strategic Store Placement System © 2025
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-indigo-50/30 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fadeInUp">
        <Card className="bg-white/90 backdrop-blur-xl border-gray-100/80 shadow-2xl shadow-gray-900/10 rounded-3xl">
        <CardHeader className="space-y-4 pb-2">
          {/* Back button */}
          <button
            className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit"
            onClick={() => navigate("/user/login")}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </button>

          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16 bg-linear-to-br from-primary to-purple-600 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
              <div className="absolute -inset-1 bg-linear-to-br from-primary to-purple-600 rounded-2xl blur opacity-30 -z-10" />
            </div>

            <div className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Create New Password
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Enter and confirm your new password
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">New Password</Label>
              <Input
                type="password"
                icon={<Lock className="w-5 h-5" />}
                value={newPassword}
                placeholder="Enter new password"
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: "" }));
                }}
                onBlur={() => handleBlur("newPassword")}
                error={touched.newPassword && !!fieldErrors.newPassword}
                required
              />
              {touched.newPassword && fieldErrors.newPassword && <FieldError error={fieldErrors.newPassword} />}
              {isFieldValid("newPassword") && <FieldSuccess message="Password meets requirements" />}
              <p className="text-xs text-gray-400">
                Must be 8+ characters with uppercase and number
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
              <Input
                type="password"
                icon={<Lock className="w-5 h-5" />}
                value={confirm}
                placeholder="Confirm new password"
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (fieldErrors.confirm) setFieldErrors(prev => ({ ...prev, confirm: "" }));
                }}
                onBlur={() => handleBlur("confirm")}
                error={touched.confirm && !!fieldErrors.confirm}
                required
              />
              {touched.confirm && fieldErrors.confirm && <FieldError error={fieldErrors.confirm} />}
              {isFieldValid("confirm") && <FieldSuccess message="Passwords match" />}
            </div>

            <Button type="submit" variant="gradient" className="w-full h-12" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
          
          {/* Footer */}
          <p className="text-center text-xs text-gray-400 pt-6 border-t border-gray-100 mt-6">
            Strategic Store Placement System © 2025
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
