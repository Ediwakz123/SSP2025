import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = "/api/v1/auth"; // ✔ Works with Vercel serverless

export function AdminLoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid admin credentials");
      }

      // ✔ Ensure user is admin
      if (!data.user || data.user.role !== "admin") {
        throw new Error("Access denied. Admin credentials required.");
      }

      // ✔ Save session
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Admin login successful!");

      // ✔ Redirect to Admin Dashboard
      navigate("/admin");
    } catch (err: any) {
      console.error("Admin login error:", err);
      const msg = err.message || "Admin login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            className="w-fit -ml-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex justify-center">
            <div className="bg-purple-100 p-4 rounded-full">
              <Shield className="size-12 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Admin Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in with your administrator credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In to Admin Portal'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p>Looking for the user portal?</p>
              <Button
                variant="link"
                className="text-blue-600"
                onClick={() => navigate('/login')}
              >
                Sign in as User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
