"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { createClient } from "@/lib/supabase-client";
import { X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show success message if email was just verified
    if (searchParams.get('verified') === 'true') {
      toast.success('Email verified successfully! Please log in.');
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user types

    // Validate email as user types
    if (name === "email") {
      if (!validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const clearField = (fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: ""
    }));
    if (fieldName === "email") {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("Login submission started");

    try {
      const supabase = createClient();
      console.log("Attempting to sign in user...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        console.error("Login error:", error);
        setError(error.message);
        throw error;
      }

      if (data?.user) {
        console.log("User logged in successfully:", data.user.id);
        
        // First check if user has completed their profile
        console.log("Checking for existing profile...");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.log("Error fetching profile:", profileError);
        }
        
        // DETAILED LOGGING START
        console.log("Profile check results:", { profile, profileError });
        // DETAILED LOGGING END

        // Check if profile exists and has required fields
        const isProfileComplete = profile && 
          profile.name && 
          profile.age && 
          profile.college_name && 
          profile.education && 
          profile.year && 
          profile.city;

        if (!isProfileComplete) {
          console.log("No complete profile found, redirecting to registration");
          toast.info("Please complete your profile registration");
          router.push("/register");
          return;
        }

        // Only if profile exists and is complete, redirect to appropriate vote page
        console.log("Complete profile found:", profile);
        console.log("User gender:", data.user.user_metadata?.gender);
        const userGender = data.user.user_metadata?.gender;
        
        if (userGender === 'male') {
          console.log("Redirecting to boys vote page");
          router.push("/vote/boys");
        } else if (userGender === 'female') {
          console.log("Redirecting to girls vote page");
          router.push("/vote/girls");
        } else {
          console.log("No gender specified, redirecting to general vote page");
          router.push("/vote");
        }
      } else {
        console.error("No user data received after successful login");
        throw new Error("Login failed - no user data received");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-purple-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 shadow-xl bg-white/95 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <i className="fa-solid fa-heart-pulse text-3xl text-indigo-600"></i>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CampusVotes
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-sm text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10 ${
                    emailError ? "border-red-500" : ""
                  }`}
                  required
                />
                {formData.email && (
                  <button
                    type="button"
                    onClick={() => clearField("email")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {emailError && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-14"
                  required
                />
                <div className="absolute right-0 top-0 h-full flex items-center pr-2 gap-0.5">
                  {formData.password && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => clearField("password")}
                        className="text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors duration-200"
              disabled={loading || !!emailError}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
} 