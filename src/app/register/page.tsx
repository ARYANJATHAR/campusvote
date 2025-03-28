"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { GradientText } from "@/components/landing/GradientText";
import { GradientButton } from "@/components/ui/gradient-button";
import { Upload, User, Camera, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase-client";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProfileFormData {
  name: string;
  age: string;
  collegeName: string;
  education: string;
  year: string;
  city: string;
  hobbies: string;
  bio: string;
  profileImage: File | null;
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userGender, setUserGender] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    collegeName: "",
    education: "",
    year: "",
    city: "",
    hobbies: "",
    bio: "",
    profileImage: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    const getUserGender = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.gender) {
        setUserGender(session.user.user_metadata.gender);
      }
    };
    getUserGender();
  }, [supabase.auth]);

  const validateAge = (age: string) => {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return "Please enter a valid age";
    if (ageNum < 18) return "You must be at least 18 years old";
    if (ageNum > 30) return "Age must be 30 or less";
    return "";
  };

  const validateImage = (file: File) => {
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return "Image size must be less than 5MB";
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return "Only JPEG, PNG, and JPG images are allowed";
    }

    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setFieldErrors(prev => ({ ...prev, [name]: "" }));

    // Validate age as user types
    if (name === "age") {
      const ageError = validateAge(value);
      if (ageError) {
        setFieldErrors(prev => ({ ...prev, age: ageError }));
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageError = validateImage(file);
      if (imageError) {
        setImageError(imageError);
        return;
      }
      setImageError("");
      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      toast.error("Name is required");
      return false;
    }
    const ageNum = parseInt(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 16 || ageNum > 25) {
      setError("Age must be between 16 and 25");
      toast.error("Age must be between 16 and 25");
      return false;
    }
    if (!formData.collegeName.trim()) {
      setError("College name is required");
      toast.error("College name is required");
      return false;
    }
    if (!formData.education.trim()) {
      setError("Education is required");
      toast.error("Education is required");
      return false;
    }
    if (!formData.year) {
      setError("Year is required");
      toast.error("Year is required");
      return false;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      toast.error("City is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        toast.error("Authentication error: " + sessionError.message);
        throw sessionError;
      }
      if (!session?.user) {
        toast.error("No user session found. Please log in again.");
        throw new Error('No user session found');
      }

      // Upload profile image if exists
      let profileImageUrl = null;
      if (formData.profileImage) {
        try {
          const fileExt = formData.profileImage.name.split('.').pop();
          const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
          const filePath = `profile-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, formData.profileImage);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast.error("Failed to upload profile image: " + uploadError.message);
            throw new Error('Failed to upload profile image');
          }

          const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath);

          profileImageUrl = publicUrl;
          toast.success("Profile image uploaded successfully!");
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          toast.error("Failed to upload image. Continuing without profile image.");
          // Continue without the image if upload fails
        }
      }

      // Update user profile in Supabase
      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          name: formData.name.trim(),
          age: parseInt(formData.age),
          college_name: formData.collegeName.trim(),
          education: formData.education.trim(),
          year: formData.year,
          city: formData.city.trim(),
          hobbies: formData.hobbies.trim(),
          bio: formData.bio.trim(),
          profile_image: profileImageUrl,
          gender: session.user.user_metadata?.gender,
          votes: 0, // Initialize votes to 0
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (updateError) {
        console.error('Profile update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        toast.error(`Failed to update profile: ${updateError.message}`);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      toast.success("Profile created successfully!");

      // Get user's gender from metadata
      const gender = session.user.user_metadata?.gender;
      console.log('User gender:', gender);

      if (!gender) {
        toast.error("Gender not found in user metadata");
        throw new Error('Gender not found in user metadata');
      }

      // Redirect based on gender
      if (gender === 'male') {
        console.log('Redirecting to boys vote page...');
        router.push('/vote/boys');
      } else if (gender === 'female') {
        console.log('Redirecting to girls vote page...');
        router.push('/vote/girls');
      } else {
        toast.error("Invalid gender value");
        throw new Error('Invalid gender value');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center p-4 pt-20 pb-16">
        <Card className="w-full max-w-2xl p-8 bg-white/80 backdrop-blur-md border border-gray-100 shadow-xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <i className="fa-solid fa-heart-pulse text-2xl text-indigo-600 animate-pulse"></i>
              <span className="text-2xl font-bold">
                <GradientText className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  CampusVotes
                </GradientText>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Complete Your Profile</h1>
            <p className="text-gray-600 mt-2">Tell us more about yourself</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-40 h-40 mb-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full rounded-full object-cover ring-4 ring-indigo-100 transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center ring-4 ring-indigo-100">
                    <User className="w-16 h-16 text-indigo-400" />
                  </div>
                )}
                <label
                  htmlFor="profileImage"
                  className="absolute bottom-2 right-2 bg-white text-indigo-600 p-2 rounded-full cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                >
                  <Camera className="w-5 h-5" />
                </label>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
              </div>
              <p className="text-sm text-gray-500">Upload your profile picture (max 5MB, JPEG/PNG/JPG)</p>
              {imageError && (
                <p className="text-sm text-red-500 mt-1">{imageError}</p>
              )}
              {fieldErrors.profileImage && (
                <p className="text-sm text-red-500 mt-1">{fieldErrors.profileImage}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 ${
                    fieldErrors.name ? "border-red-500" : ""
                  }`}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-medium text-gray-700">
                  Age (18-30)
                </label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="18"
                  max="30"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`w-full border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 ${
                    fieldErrors.age ? "border-red-500" : ""
                  }`}
                  required
                />
                {fieldErrors.age && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.age}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="college_name" className="text-gray-700">College Name</Label>
                <Input
                  id="college_name"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  required
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="education" className="text-gray-700">Education Level</Label>
                <Input
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="e.g., Bachelor's in Computer Science"
                  required
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="year" className="text-gray-700">Year</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, year: value }))
                  }
                >
                  <SelectTrigger className="w-full border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200">
                    <SelectValue placeholder="Select current year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

            <div className="space-y-2">
              <label htmlFor="hobbies" className="text-sm font-medium text-gray-700">
                Hobbies & Interests
              </label>
              <Textarea
                id="hobbies"
                name="hobbies"
                placeholder="Tell us about your hobbies and interests (e.g., reading, sports, music)"
                value={formData.hobbies}
                onChange={handleChange}
                className="w-full border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 min-h-[100px]"
                required
              />
            </div>

            <GradientButton
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Completing Registration..." : "Complete Registration"}
            </GradientButton>
          </form>
        </Card>
      </main>
    </div>
  );
} 