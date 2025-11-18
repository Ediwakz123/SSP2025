import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_URL; 
// ✔ resolves to "/api"
// ✔ works on Vercel and local dev

export default function UserLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!email.includes("@")) return "Enter a valid email.";
    if (!password.trim()) return "Password is required.";
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", email.trim());
      formData.append("password", password);

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Invalid login credentials.");
      }

      // ✔ Save login session
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Login successful!");

      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload();
      }, 500);

    } catch (err: any) {
      const msg = err.message || "Login failed.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Welcome Back</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Sign in to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* EMAIL */}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-black"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => navigate("/register")}
              >
                Create one
              </button>
            </p>
          </form>
        </CardContent>

      </Card>
    </div>
  );
}
