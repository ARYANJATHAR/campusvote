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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Only redirect if profile exists AND all required fields are filled
      if (profile && 
          profile.name && 
          profile.age && 
          profile.college_name && 
          profile.education &&
          profile.year &&
          profile.city &&
          profile.hobbies &&
          profile.bio) {
        // If profile exists and is complete, redirect to appropriate dashboard
        const gender = session.user.user_metadata?.gender;
        if (gender === 'male') {
          router.push('/dashboard/boys');
        } else if (gender === 'female') {
          router.push('/dashboard/girls');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Get user's gender from metadata
        const gender = session.user.user_metadata?.gender;
        if (gender) {
          setUserGender(gender);
        }
      }
    };

    checkAuth();
  }, [router, supabase]);

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
    const errors: { [key: string]: string } = {};

    // Check all required fields
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.age) {
      errors.age = "Age is required";
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 30) {
        errors.age = "Age must be between 18 and 30";
      }
    }

    if (!formData.collegeName.trim()) {
      errors.collegeName = "College name is required";
    }

    if (!formData.education.trim()) {
      errors.education = "Education is required";
    }

    if (!formData.year) {
      errors.year = "Year is required";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required";
    }

    if (!formData.hobbies.trim()) {
      errors.hobbies = "Hobbies are required";
    }

    if (!formData.bio.trim()) {
      errors.bio = "Bio is required";
    }

    if (!formData.profileImage) {
      errors.profileImage = "Profile image is required";
    }

    // Update field errors state
    setFieldErrors(errors);

    // If there are any errors, set the main error message
    if (Object.keys(errors).length > 0) {
      setError("Please fill in all required fields");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Form submission started');
    e.preventDefault();
    e.stopPropagation();
    setError("");
    setLoading(true);

    if (!validateForm()) {
      console.log('Form validation failed');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to get user session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError("Authentication error: " + sessionError.message);
        throw sessionError;
      }
      if (!session?.user) {
        console.error('No user session found');
        setError("No user session found. Please log in again.");
        throw new Error('No user session found');
      }

      let profileImageUrl = null;
      if (formData.profileImage) {
        try {
          console.log('Starting profile image upload');
          const fileExt = formData.profileImage.name.split('.').pop();
          const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
          const filePath = `profile-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, formData.profileImage);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            setError("Failed to upload profile image: " + uploadError.message);
            throw new Error('Failed to upload profile image');
          }

          const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath);

          profileImageUrl = publicUrl;
          console.log('Profile image uploaded successfully');
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          // Continue without the image if upload fails
        }
      }

      console.log('Updating user profile');
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
          votes: 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError(`Failed to update profile: ${updateError.message}`);
        throw updateError;
      }

      console.log('Profile created successfully');

      const gender = session.user.user_metadata?.gender;
      console.log('User gender:', gender);

      if (!gender) {
        console.error('Gender not found in metadata');
        setError("Gender not found in user metadata");
        throw new Error('Gender not found in user metadata');
      }

      console.log('Redirecting based on gender:', gender);
      if (gender === 'male') {
        console.log('Redirecting to boys dashboard...');
        router.push('/dashboard/boys');
      } else if (gender === 'female') {
        console.log('Redirecting to girls dashboard...');
        router.push('/dashboard/girls');
      } else {
        console.log('Redirecting to main dashboard...');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Modify the handleSubmitButtonClick function
  const handleSubmitButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('Submit button clicked/touched');
    e.preventDefault();
    e.stopPropagation();
    
    // Directly call handleSubmit instead of dispatching event
    handleSubmit(new Event('submit') as any);
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

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className="space-y-6"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-40 h-40 mb-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className={`w-full h-full rounded-full object-cover ring-4 ${
                      fieldErrors.profileImage ? "ring-red-200" : "ring-indigo-100"
                    } transition-transform duration-300 hover:scale-105`}
                  />
                ) : (
                  <div className={`w-full h-full rounded-full bg-indigo-50 flex items-center justify-center ring-4 ${
                    fieldErrors.profileImage ? "ring-red-200" : "ring-indigo-100"
                  }`}>
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
              <p className="text-sm text-gray-500">
                Upload your profile picture (max 5MB, JPEG/PNG/JPG) <span className="text-red-500">*</span>
              </p>
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
                  Full Name <span className="text-red-500">*</span>
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
                  Age (18-30) <span className="text-red-500">*</span>
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
                <Label htmlFor="college_name" className="text-gray-700">
                  College Name <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="education" className="text-gray-700">
                  Education Level <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="year" className="text-gray-700">
                  Year <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, year: value }))
                  }
                  required
                >
                  <SelectTrigger className={`w-full border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 ${
                    fieldErrors.year ? "border-red-500" : ""
                  }`}>
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
                <Label htmlFor="city" className="text-gray-700">
                  City <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="bio" className="text-gray-700">
                  Bio <span className="text-red-500">*</span>
                </Label>
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
                Hobbies & Interests <span className="text-red-500">*</span>
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

            <div className="w-full">
              <button
                type="button" // Changed from 'submit' to 'button'
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg py-3 px-4 flex items-center justify-center gap-2 touch-manipulation active:scale-95"
                disabled={loading}
                onClick={handleSubmitButtonClick}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  handleSubmitButtonClick(e);
                }}
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  outline: 'none',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Save className="h-4 w-4" />
                <span className="font-medium">
                  {loading ? "Completing Registration..." : "Complete Registration"}
                </span>
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
} 