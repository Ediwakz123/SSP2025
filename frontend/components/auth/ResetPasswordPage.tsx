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
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
        <Card className="w-full max-w-md bg-white text-black shadow-xl rounded-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>

            <CardTitle className="text-2xl font-semibold">Password Reset</CardTitle>
            <CardDescription>Your password has been updated.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Button className="w-full bg-black text-white" onClick={() => navigate("/user/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md bg-white text-black shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <Button
            variant="ghost"
            className="w-fit -ml-2 text-gray-600"
            onClick={() => navigate("/user/login")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Button>

          <div className="mx-auto w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <CardTitle className="text-2xl font-semibold">
            Create New Password
          </CardTitle>

          <CardDescription>Enter and confirm your new password.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: "" }));
                }}
                onBlur={() => handleBlur("newPassword")}
                className={`bg-[#DCDCDC] text-black ${touched.newPassword && fieldErrors.newPassword ? "border-red-500" : ""}`}
                required
              />
              {touched.newPassword && fieldErrors.newPassword && <FieldError error={fieldErrors.newPassword} />}
              {isFieldValid("newPassword") && <FieldSuccess message="Password meets requirements" />}
              <p className="text-xs text-gray-500 mt-1">
                Must be 8+ characters with uppercase and number
              </p>
            </div>

            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (fieldErrors.confirm) setFieldErrors(prev => ({ ...prev, confirm: "" }));
                }}
                onBlur={() => handleBlur("confirm")}
                className={`bg-[#DCDCDC] text-black ${touched.confirm && fieldErrors.confirm ? "border-red-500" : ""}`}
                required
              />
              {touched.confirm && fieldErrors.confirm && <FieldError error={fieldErrors.confirm} />}
              {isFieldValid("confirm") && <FieldSuccess message="Passwords match" />}
            </div>

            <Button type="submit" className="w-full bg-black text-white" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
