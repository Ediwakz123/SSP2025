
import { useState, useCallback } from "react";
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

import { MapPin, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { validateEmail as validateEmailUtil } from "../../utils/validation";

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

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [_isSubmitted, _setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Field-level validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const _validateEmail = (email: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  const handleBlur = useCallback(() => {
    setTouched({ email: true });
    const result = validateEmailUtil(email);
    setFieldErrors({ email: result.error || "" });
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate before submission
    const result = validateEmailUtil(email);
    if (!result.isValid) {
      setFieldErrors({ email: result.error || "" });
      setTouched({ email: true });
      toast.error(result.error || "Please enter a valid email address.");
      setLoading(false);
      return;
    }

    // 🟩 CHECK USER EXISTS (your RPC)
    const { data: userCheck } = await supabase.rpc("check_user_exists", {
      email_to_check: email,
    });

    if (!userCheck?.exists) {
      toast.error("This email is not registered.");
      setLoading(false);
      return;
    }

    // 🟩 SEND OTP INSTEAD OF RESET LINK
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("A 6-digit verification code has been sent to your email.");
    navigate(`/enter-code?email=${email}`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-indigo-50/30 p-4">
      {/* Background decoration */}
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
              <MapPin className="w-8 h-8 text-white" />
              <div className="absolute -inset-1 bg-linear-to-br from-primary to-purple-600 rounded-2xl blur opacity-30 -z-10" />
            </div>

            <div className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Reset Password
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Enter your email to receive a 6-digit verification code
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ email: "" });
                  }}
                  onBlur={handleBlur}
                  className={`pl-10 bg-gray-100 text-black ${touched.email && fieldErrors.email ? "border-red-500" : ""}`}
                  required
                />
              </div>
              {touched.email && <FieldError error={fieldErrors.email} />}

              <p className="text-xs text-gray-500">
                We'll send you a 6-digit code to verify your identity
              </p>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Verification Code"}
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
