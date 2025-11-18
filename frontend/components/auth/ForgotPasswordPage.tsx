import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { MapPin, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL; 
// ✔ This becomes "/api"
// ✔ Works on Vercel serverless

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to send reset instructions.");
      }

      toast.success("Password reset instructions have been sent!");
      setIsSubmitted(true);

    } catch (err: any) {
      toast.error(err.message || "Error sending reset email.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Success Page -------------------
  if (isSubmitted) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Check Your Email</CardTitle>
              <CardDescription className="text-base mt-2">
                We've sent password reset instructions to {email}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                If you don't see the email, check your spam folder or try again.
              </p>

              <Button variant="outline" className="w-full" onClick={onBackToLogin}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ------------------- Form Page -------------------
  return (
    <div className="min-h-screen w-full bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold">Reset Password</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your email to receive reset instructions
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* EMAIL INPUT */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll send you a link to reset your password
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {/* BACK BUTTON */}
          <div className="mt-6">
            <Button variant="ghost" className="w-full" onClick={onBackToLogin}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Thesis Project © 2025
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
