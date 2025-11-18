import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Edit2,
} from "lucide-react";
import { apiRequest } from "../../utils/api";
import { toast } from "sonner";

type ProfileData = {
  id?: string;
  firstName?: string;
  lastName?: string;
  age?: number | null;
  gender?: string | null;
  contactNumber?: string | null;
  address?: string | null;
  email?: string;
  createdAt?: string;
  created_at?: string;
};

export function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    contactNumber: "",
    address: "",
    gender: "",
  });

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const accessToken =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!accessToken) {
        toast.error("You are not logged in.");
        setLoadingProfile(false);
        return;
      }

      // ⬇️ NEW: use user profile route
      const data = await apiRequest(
        "/api/user/profile",
        { method: "GET" },
        accessToken
      );

      const p: ProfileData = data || data.profile || {};

      setProfile(p);
      setFormData({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        age: p.age != null ? String(p.age) : "",
        contactNumber: p.contactNumber || "",
        address: p.address || "",
        gender: p.gender || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);

      const accessToken =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!accessToken) {
        toast.error("You are not logged in.");
        setSaving(false);
        return;
      }

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        age: formData.age ? Number(formData.age) : null,
        gender: formData.gender || null,
        phone: formData.contactNumber || null,
        address: formData.address || null,
      };

      // ⬇️ NEW: PUT to user profile route
      const updated = await apiRequest(
        "/api/user/profile",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        accessToken
      );

      const merged: ProfileData = {
        ...profile,
        ...updated.data,
      };

      setProfile(merged);
      setEditing(false);
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const joinedDate =
    profile?.createdAt || profile?.created_at
      ? new Date(
          profile.createdAt || (profile.created_at as string)
        ).toLocaleDateString()
      : "N/A";

  const fullName = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
      "Unnamed User"
    : "Loading…";

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account information
          </p>
        </div>
        {profile && !editing && (
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            className="hidden md:inline-flex"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left card: Account details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingProfile ? (
              <div className="space-y-3 animate-pulse">
                <div className="w-24 h-24 bg-muted rounded-full mx-auto" />
                <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                <div className="h-3 bg-muted rounded w-full mt-4" />
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <User className="w-12 h-12 text-indigo-600" />
                  </div>
                  <h3 className="font-medium text-lg">{fullName}</h3>
                  <p className="text-sm text-gray-500">
                    {profile?.email || "No email"}
                  </p>
                  <div className="mt-4 w-full space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Joined {joinedDate}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right card: Personal information (view + edit) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </div>
            {profile && !editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="md:hidden"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </CardHeader>

          <CardContent>
            {loadingProfile ? (
              <div className="space-y-3 animate-pulse">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                </div>
              </div>
            ) : editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          age: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value })
                      }
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactNumber: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdate} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // reset form to current profile values
                      if (profile) {
                        setFormData({
                          firstName: profile.firstName || "",
                          lastName: profile.lastName || "",
                          age:
                            profile.age != null
                              ? String(profile.age)
                              : "",
                          contactNumber:
                            profile.contactNumber || "",
                          address: profile.address || "",
                          gender: profile.gender || "",
                        });
                      }
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">First Name</p>
                    <p className="font-medium">
                      {profile?.firstName || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Last Name</p>
                    <p className="font-medium">
                      {profile?.lastName || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">
                      {profile?.age ?? "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium capitalize">
                      {profile?.gender || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      Contact Number
                    </p>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="font-medium">
                        {profile?.contactNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Email</p>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="font-medium">
                        {profile?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t">
                  <p className="text-sm text-gray-500">Address</p>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="font-medium">
                      {profile?.address || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
