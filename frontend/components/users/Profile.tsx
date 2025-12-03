import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import { useActivity, logActivity } from "../../utils/activity";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";

import { Mail, Calendar, Pencil, Save, X, Loader2 } from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number | "";
  gender: string;
  contactNumber: string;
  address: string;
  createdAt: string;
  lastUpdated?: string;
}

export function Profile() {
  useActivity(); // logs "Viewed Profile Page"

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    contactNumber: "",
    address: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    age: "",
    contactNumber: "",
  });

  // ----------------------------------------------------
  // LOAD PROFILE
  // ----------------------------------------------------
  const loadProfile = async () => {
    try {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const u = data.user;

      const p: ProfileData = {
        id: u.id,
        email: u.email ?? "",
        firstName: u.user_metadata.first_name || "",
        lastName: u.user_metadata.last_name || "",
        age: u.user_metadata.age || "",
        gender: u.user_metadata.gender || "",
        contactNumber: u.user_metadata.contact_number || "",
        address: u.user_metadata.address || "",
        createdAt: u.created_at,
        lastUpdated: u.user_metadata.last_updated || "",
      };

      setProfile(p);

      setFormData({
        firstName: p.firstName,
        lastName: p.lastName,
        age: p.age ? String(p.age) : "",
        gender: p.gender,
        contactNumber: p.contactNumber,
        address: p.address,
      });
    } catch {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logActivity("Viewed Profile Page");
    loadProfile();
  }, []);

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  const capitalize = (str: string) =>
    str
      .trim()
      .replace(/\s+/g, " ")
      .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

  const cleanPhone = (str: string) => str.replace(/\s+/g, " ").trim();

  const formatGender = (g: string) => (g ? g.charAt(0).toUpperCase() + g.slice(1) : "");

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // ----------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------
  const validateForm = () => {
    const newErrors = { firstName: "", lastName: "", age: "", contactNumber: "" };
    let valid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Required";
      valid = false;
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Required";
      valid = false;
    }
    if (formData.age) {
      const n = Number(formData.age);
      if (isNaN(n) || n < 1 || n > 120) {
        newErrors.age = "Invalid age";
        valid = false;
      }
    }
    if (formData.contactNumber && !/^\+?[\d\s\-()]{7,20}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Invalid phone number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ----------------------------------------------------
  // SAVE PROFILE
  // ----------------------------------------------------
  const handleSave = async () => {
    if (!validateForm()) return;

    logActivity("Attempted to Save Profile");

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const updates = {
        data: {
          first_name: capitalize(formData.firstName),
          last_name: capitalize(formData.lastName),
          age: formData.age ? Number(formData.age) : null,
          gender: formData.gender,
          contact_number: cleanPhone(formData.contactNumber),
          address: formData.address.trim(),
          last_updated: now,
        },
      };

      const { error } = await supabase.auth.updateUser(updates);

      if (error) {
        toast.error(error.message);
        logActivity("Profile Update Failed", { error: error.message });
        return;
      }

      toast.success("Profile updated!");

      logActivity("Saved Profile", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        address: formData.address,
      });

      setEditing(false);
      loadProfile();
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // COMPLETION %
  // ----------------------------------------------------
  const completionPercentage = (() => {
    if (!profile) return 0;

    const fields = [
      profile.firstName,
      profile.lastName,
      profile.age,
      profile.gender,
      profile.contactNumber,
      profile.address,
    ];

    const filled = fields.filter((f) => f && f !== "").length;
    return Math.round((filled / fields.length) * 100);
  })();

  const editClass = editing ? "ring-2 ring-blue-300 shadow-md" : "bg-muted";

  // ---------------------------
  // LOADING SCREEN
  // ---------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading profile...
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN UI
  // ----------------------------------------------------
  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-6 items-center">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="text-2xl">
              {profile?.firstName?.[0]}
              {profile?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-semibold">
              {profile?.firstName} {profile?.lastName}
            </h1>

            <div className="flex justify-center md:justify-start gap-2 text-muted-foreground mt-1">
              <Mail size={16} />
              <span>{profile?.email}</span>
            </div>

            <div className="flex justify-center md:justify-start gap-2 text-muted-foreground mt-1">
              <Calendar size={16} />
              <span>Joined {formatDate(profile!.createdAt)}</span>
            </div>

            {profile?.lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {formatDate(profile.lastUpdated)}
              </p>
            )}
          </div>

          {!editing && (
            <Button
              onClick={() => {
                setEditing(true);
                toast.info("You are now editing your profile.");
                logActivity("Opened Profile Edit Mode");
              }}
            >
              <Pencil className="mr-2" size={16} /> Edit
            </Button>
          )}
        </CardContent>
      </Card>

      {/* PROFILE COMPLETION */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>
            {completionPercentage}% complete — Fill in missing fields to complete your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* DETAILS */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            {editing ? "Update your profile information" : "Your personal information"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* PERSONAL INFO */}
          <div>
            <h3 className="font-medium text-lg mb-3">Personal Info</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium">First Name</Label>
                <Input
                  className={editing ? editClass : "bg-muted"}
                  disabled={!editing}
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: capitalize(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Last Name</Label>
                <Input
                  className={editing ? editClass : "bg-muted"}
                  disabled={!editing}
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: capitalize(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* OTHER DETAILS */}
          <div>
            <h3 className="font-medium text-lg mb-3">Other Details</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium">Age</Label>
                <Input
                  className={editing ? editClass : "bg-muted"}
                  type="number"
                  disabled={!editing}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  min="1"
                  max="120"
                />
                {errors.age && <p className="text-red-600 text-sm">{errors.age}</p>}
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Gender</Label>
                {editing ? (
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger className={editClass}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input disabled className="bg-muted" value={formatGender(formData.gender)} />
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* CONTACT INFO */}
          <div>
            <h3 className="font-medium text-lg mb-3">Contact Info</h3>

            <div className="space-y-2">
              <Label className="font-medium">Contact Number</Label>
              <Input
                className={editing ? editClass : "bg-muted"}
                disabled={!editing}
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData({ ...formData, contactNumber: cleanPhone(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2 mt-6">
              <Label className="font-medium">Address</Label>
              {editing ? (
                <Textarea
                  className={editClass}
                  rows={3}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              ) : (
                <Input disabled className="bg-muted" value={formData.address} />
              )}
            </div>
          </div>

          {/* ACTIONS */}
          {editing && (
            <div className="flex justify-end gap-4 mt-10">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  toast.warning("Edit cancelled.");
                  logActivity("Cancelled Profile Edit");
                }}
              >
                <X className="mr-2" size={16} /> Cancel
              </Button>

              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2" size={16} />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
