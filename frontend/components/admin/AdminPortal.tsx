import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

declare global {
  interface Window {
    navigateTo?: (path: string) => void;
  }
}

const API_BASE_URL = "/api"; // ✔ Works with Vercel Serverless

export default function Register({ onRegisterSuccess }: { onRegisterSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    date_of_birth: "",
    address: "",
    age: "",
    gender: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenderChange = (value: string) => {
    setFormData({ ...formData, gender: value });
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword, age } = formData;

    if (!firstName || !lastName) {
      toast.error("Please enter your full name.");
      return false;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }

    if (!age || isNaN(Number(age)) || Number(age) < 18) {
      toast.error("You must be at least 18 years old to register.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          contact_number: formData.contactNumber.trim(),
          address: formData.address.trim(),
          age: parseInt(formData.age),
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Registration failed.");
      }

      const data = await response.json();

      // ✔ Save token & user
      localStorage.setItem("access_token", data.access_token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("🎉 Account created successfully!");

      // ✔ Callback support
      if (onRegisterSuccess) onRegisterSuccess();

      // ✔ Redirect
      setTimeout(() => {
        if (window.navigateTo) {
          window.navigateTo("/dashboard");
        } else {
          window.location.href = "/dashboard";
        }
      }, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Create Account
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Join the Store Placement Analysis System
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* NAME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                name="firstName"
                placeholder="First Name *"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <Input
                name="lastName"
                placeholder="Last Name *"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            {/* EMAIL */}
            <Input
              name="email"
              type="email"
              placeholder="Email Address *"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            {/* PASSWORD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                name="password"
                type="password"
                placeholder="Password * (min. 8 chars)"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            {/* CONTACT NUMBER */}
            <Input
              name="contactNumber"
              placeholder="Contact Number *"
              value={formData.contactNumber}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            {/* ADDRESS */}
            <Input
              name="address"
              placeholder="Address (Street, Barangay, City, Province) *"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            {/* DATE OF BIRTH */}
            <Input
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              disabled={isLoading}
              required
            />

            {/* AGE + GENDER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                name="age"
                type="number"
                placeholder="Age *"
                value={formData.age}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <Select onValueChange={handleGenderChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Gender *" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SUBMIT */}
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            {/* LOGIN LINK */}
            <div className="text-center text-sm text-muted-foreground mt-2">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Sign in here
              </a>
            </div>

            {/* SECURITY NOTE */}
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-md p-3">
              <p>
                <strong>Note:</strong> Your information is securely processed via Vercel Serverless Functions and stored in Supabase.
              </p>
            </div>

            {/* BACK BUTTON */}
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => (window.location.href = "/login")}
                disabled={isLoading}
              >
                ← Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
