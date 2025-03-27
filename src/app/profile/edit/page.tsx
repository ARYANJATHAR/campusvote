"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { GradientText } from "@/components/landing/GradientText";
import { GradientButton } from "@/components/ui/gradient-button";
import { Upload, Save, X } from "lucide-react";

interface ProfileFormData {
  name: string;
  age: number;
  college_name: string;
  education: string;
  year: string;
  city: string;
  bio: string;
  hobbies: string;
  profile_image: string | null;
}

export default function EditProfile() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    age: 18,
    college_name: "",
    education: "",
    year: "",
    city: "",
    bio: "",
    hobbies: "",
    profile_image: null
  });

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setFormData({
            name: profile.name || "",
            age: profile.age || 18,
            college_name: profile.college_name || "",
            education: profile.education || "",
            year: profile.year || "",
            city: profile.city || "",
            bio: profile.bio || "",
            hobbies: profile.hobbies || "",
            profile_image: profile.profile_image
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 18 : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        toast.error("Please select a file");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to upload images");
        return;
      }

      // Upload image with a more unique filename to prevent collisions
      const fileExt = file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const fileName = `${session.user.id}-${timestamp}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;

      // Upload directly to the profiles bucket without checking existence
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Supabase storage error:", error);
        toast.error(error.message || "Failed to upload image");
        return;
      }

      // Get public URL with cache busting parameter
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      // Add cache busting parameter
      const cacheBustUrl = `${publicUrl}?t=${timestamp}`;

      setFormData(prev => ({
        ...prev,
        profile_image: cacheBustUrl
      }));

      toast.success("Profile image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("An unexpected error occurred while uploading the image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Add timestamp to profile image URL to bust cache if it exists
      const updatedFormData = {...formData};
      if (updatedFormData.profile_image) {
        // Add a timestamp query parameter to bust cache
        const timestamp = new Date().getTime();
        const separator = updatedFormData.profile_image.includes('?') ? '&' : '?';
        updatedFormData.profile_image = `${updatedFormData.profile_image}${separator}t=${timestamp}`;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updatedFormData)
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      
      // Check user gender and redirect accordingly
      const userGender = session.user.user_metadata?.gender;
      if (userGender === 'male') {
        router.push("/dashboard/boys");
      } else if (userGender === 'female') {
        router.push("/dashboard/girls");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-indigo-50 to-purple-50 p-4 pt-24">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-white/80 backdrop-blur-md border border-gray-100 shadow-xl">
            <h1 className="text-3xl font-bold mb-2">
              <GradientText className="bg-gradient-to-r from-indigo-600 to-purple-600">
                Edit Profile
              </GradientText>
            </h1>
            <p className="text-gray-600 mb-8">Update your profile information</p>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Image */}
              <div className="space-y-3">
                <Label htmlFor="profile_image" className="text-gray-700">Profile Image</Label>
                <div className="flex items-center gap-6">
                  {formData.profile_image && (
                    <div className="relative">
                      <img
                        src={formData.profile_image}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-100 transition-transform duration-300 hover:scale-105"
                        key={formData.profile_image}
                      />
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                        <Upload className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="profile_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="flex-1 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                    />
                    <p className="text-sm text-gray-500 mt-1">Upload a profile picture (max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="age" className="text-gray-700">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min={18}
                    max={100}
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Education Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="college_name" className="text-gray-700">College Name</Label>
                  <Input
                    id="college_name"
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleChange}
                    required
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="education" className="text-gray-700">Education</Label>
                  <Input
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    required
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="year" className="text-gray-700">Year</Label>
                <Input
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                />
              </div>

              {/* Location Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="city" className="text-gray-700">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bio" className="text-gray-700">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    required
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 min-h-[100px]"
                  />
                </div>
              </div>

              {/* Hobbies */}
              <div className="space-y-3">
                <Label htmlFor="hobbies" className="text-gray-700">Hobbies & Interests (comma-separated)</Label>
                <Textarea
                  id="hobbies"
                  name="hobbies"
                  value={formData.hobbies}
                  onChange={handleChange}
                  placeholder="Photography, Basketball, Travel..."
                  required
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 min-h-[100px]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <GradientButton
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </GradientButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
} 