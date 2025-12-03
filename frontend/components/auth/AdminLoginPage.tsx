import { useState, useEffect, useRef } from "react";
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
import { Alert, AlertDescription } from "../ui/alert";
import { Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 3;
const SESSION_EXPIRE_MINUTES = 20;

export function AdminLoginPage() {
  const navigate = useNavigate();

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Lockout states
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const lockIntervalRef = useRef<any>(null);

  // -------------------------------
  // Load Remember Me Credential on Mount
  // -------------------------------
  useEffect(() => {
    const savedEmail = localStorage.getItem("admin_email");
    const savedPassword = localStorage.getItem("admin_password");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    if (savedPassword) setPassword(savedPassword);

    checkLockout();
  }, []);

  // -------------------------------
  // Brute-Force Protection: Check Lockout
  // -------------------------------
  const checkLockout = () => {
    const lockoutUntil = localStorage.getItem("admin_lockout_until");
    if (!lockoutUntil) return;

    const now = Date.now();
    const unlockTime = Number(lockoutUntil);

    if (now < unlockTime) {
      setIsLocked(true);
      const remaining = Math.ceil((unlockTime - now) / 1000);
      setLockCountdown(remaining);
      startCountdown(unlockTime);
    } else {
      localStorage.removeItem("admin_lockout_until");
      setIsLocked(false);
    }
  };

  const startCountdown = (unlockTime: number) => {
    if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);

    lockIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now >= unlockTime) {
        clearInterval(lockIntervalRef.current);
        setIsLocked(false);
        setLockCountdown(0);
        return;
      }

      setLockCountdown(Math.ceil((unlockTime - now) / 1000));
    }, 1000);
  };

  const recordFailedAttempt = () => {
    let fails = Number(localStorage.getItem("admin_failed_attempts") || 0);
    fails += 1;

    if (fails >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      localStorage.setItem("admin_lockout_until", lockoutUntil.toString());
      setIsLocked(true);
      startCountdown(lockoutUntil);
      toast.error("Too many failed attempts. Try again later.");
    }

    localStorage.setItem("admin_failed_attempts", fails.toString());
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem("admin_failed_attempts");
  };

  // -------------------------------
  // SESSION EXPIRATION SYSTEM
  // -------------------------------
  const setupSessionExpiration = () => {
    const expirationTime = Date.now() + SESSION_EXPIRE_MINUTES * 60 * 1000;
    localStorage.setItem("admin_session_expire", expirationTime.toString());

    let warningShown = false;

    const interval = setInterval(() => {
      const expireAt = Number(localStorage.getItem("admin_session_expire"));
      const now = Date.now();
      const minutesRemaining = Math.ceil((expireAt - now) / 60000);

      // Show warning at 2 minutes left
      if (minutesRemaining === 2 && !warningShown) {
        toast.warning("Your session will expire in 2 minutes.");
        warningShown = true;
      }

      if (now >= expireAt) {
        clearInterval(interval);
        localStorage.removeItem("admin_session_expire");
        localStorage.removeItem("admin-session");
        supabase.auth.signOut();
        toast.error("Session expired. Please log in again.");
        navigate("/admin/login");
      }
    }, 30000);
  };

  // Reset session timer on user interaction
  useEffect(() => {
    const resetTimer = () => {
      const expireAt = Date.now() + SESSION_EXPIRE_MINUTES * 60 * 1000;
      localStorage.setItem("admin_session_expire", expireAt.toString());
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  // -------------------------------
  // SUBMIT LOGIN
  // -------------------------------
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isLocked) {
    toast.error("Login temporarily locked.");
    return;
  }

  setLoading(true);
  setError("");

  // 1. Authenticate user
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    recordFailedAttempt();
    setError("Invalid admin email or password");
    toast.error("Invalid admin credentials");
    setLoading(false);
    return;
  }

  clearFailedAttempts();

  const user = data.user;
  if (!user) {
    setError("Login failed.");
    setLoading(false);
    return;
  }

  // 2. Fetch role from PROFILES table instead of metadata
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile Fetch Error:", profileError);
    toast.error("Unable to load admin profile.");
    setLoading(false);
    return;
  }

  if (profile.role !== "admin") {
    setError("Access denied. Admins only.");
    toast.error("Unauthorized access.");
    await supabase.auth.signOut();
    setLoading(false);
    return;
  }

  // 3. Update last_login
  await supabase
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", user.id);

  // 4. Save Remember Me
  if (rememberMe) {
    localStorage.setItem("admin_email", email);
    localStorage.setItem("admin_password", password);
    localStorage.setItem("admin-session", "true");
  } else {
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_password");
  }

  // 5. Start session expiration timer
  setupSessionExpiration();

  toast.success("Admin login successful!");

  // 6. Redirect to Admin Dashboard
  navigate("/admin", { replace: true });

  setLoading(false);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#f7f8ff] to-[#ece8ff] p-4">
      <Card className="w-full max-w-md bg-white text-black shadow-xl rounded-2xl">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            className="w-fit -ml-2 text-gray-600"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Home
          </Button>

          <div className="flex justify-center mt-2">
            <div className="bg-purple-100 p-4 rounded-full shadow-sm">
              <Shield className="size-12 text-purple-600" />
            </div>
          </div>

          <CardTitle className="text-center text-2xl font-semibold">
            Admin Portal
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Sign in with your administrator credentials
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* LOCKOUT MESSAGE */}
          {isLocked && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Too many failed attempts. Try again in{" "}
                <b>{lockCountdown}s</b>.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isLocked}
                required
              />
            </div>

            {/* PASSWORD WITH SHOW/HIDE */}
            <div className="space-y-2 relative">
              <Label>Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || isLocked}
                required
              />

              <button
                type="button"
                className="absolute right-3 top-9 text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <Label htmlFor="remember" className="text-sm text-gray-600">
                Remember Me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={loading || isLocked}
            >
              {loading ? "Signing in..." : "Sign In to Admin Portal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminLoginPage;
