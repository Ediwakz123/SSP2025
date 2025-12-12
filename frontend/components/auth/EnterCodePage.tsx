// 🟦 EnterCodePage.tsx (with 6-box OTP, auto-focus, resend + timer)

import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

export function EnterCodePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = params.get("email")!;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);

  // TIMER
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // TIMER COUNTDOWN
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // HANDLE OTP INPUT
  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when full
    if (newOtp.every((d) => d !== "")) {
      verifyCode(newOtp.join(""));
    }
  };

  // HANDLE BACKSPACE
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // VERIFY OTP
  const verifyCode = async (finalCode: string) => {
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: finalCode,
      type: "email",
    });

    if (error) {
      toast.error("Invalid or expired code.");
      setLoading(false);
      return;
    }

    toast.success("Code verified!");
    navigate("/reset-password-final");
  };

  // RESEND OTP
  const handleResend = async () => {
    if (!canResend) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (error) return toast.error(error.message);

    toast.success("New code sent!");
    setOtp(["", "", "", "", "", ""]);
    setTimer(30);
    setCanResend(false);
    inputs.current[0]?.focus();
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
      <CardHeader className="text-center space-y-4 pb-4">
        {/* ICON CONTAINER */}
        <div className="mx-auto relative w-16 h-16 bg-linear-to-br from-primary to-purple-600 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div className="absolute -inset-1 bg-linear-to-br from-primary to-purple-600 rounded-2xl blur opacity-30 -z-10" />
        </div>

        <CardTitle className="text-2xl font-bold text-gray-900">
          Enter Verification Code
        </CardTitle>

        <p className="text-gray-500 text-sm">
          A 6-digit code was sent to <span className="font-medium text-gray-700">{email}</span>
        </p>

      </CardHeader>

      <CardContent className="pt-2">

        {/* OTP BOXES */}
        <div className="flex justify-between gap-2 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputs.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="
                w-12 h-14 bg-gray-50 text-gray-900 text-center 
                rounded-xl border-2 border-gray-200 text-xl font-semibold
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all
                hover:border-gray-300
              "
            />
          ))}
        </div>

        {/* VERIFY BUTTON */}
        <Button
          variant="gradient"
          className="w-full h-12"
          disabled={loading}
          onClick={() => verifyCode(otp.join(""))}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        {/* RESEND + TIMER */}
        <div className="text-center mt-4">
          {canResend ? (
            <button
              type="button"
              className="text-primary font-semibold hover:text-primary/80 text-sm transition-colors"
              onClick={handleResend}
            >
              Resend Code
            </button>
          ) : (
            <p className="text-gray-500 text-sm">
              Resend in <span className="font-semibold text-gray-700">{timer}s</span>
            </p>
          )}
        </div>

        {/* CHANGE EMAIL */}
        <button
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => navigate("/forgot-password")}
        >
          ← Back to Email
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pt-6 border-t border-gray-100 mt-6">
          Strategic Store Placement System © 2025
        </p>

      </CardContent>
    </Card>
    </div>
  </div>
);}
