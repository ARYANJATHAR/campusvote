"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase";
import { X, Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    message: string;
    color: string;
  }>({ score: 0, message: "", color: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let message = "";
    let color = "";
    let criteria = [];

    // Length check (6+ characters)
    if (password.length >= 6) {
      score += 1;
    } else {
      criteria.push("at least 6 characters");
    }

    // Contains uppercase letter
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      criteria.push("uppercase letter");
    }

    // Contains lowercase letter
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      criteria.push("lowercase letter");
    }

    // Contains number
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      criteria.push("number");
    }

    // Contains special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      criteria.push("special character");
    }

    // Set message and color based on score
    if (criteria.length > 0) {
      message = `Add ${criteria.join(", ")}`;
      color = "text-red-500";
    } else {
      switch (score) {
        case 0:
        case 1:
          message = "Very Weak";
          color = "text-red-500";
          break;
        case 2:
          message = "Weak";
          color = "text-orange-500";
          break;
        case 3:
          message = "Medium";
          color = "text-yellow-500";
          break;
        case 4:
          message = "Strong";
          color = "text-green-500";
          break;
        case 5:
          message = "Very Strong";
          color = "text-green-600";
          break;
      }
    }

    return { score, message, color };
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

    // Validate password as user types
    if (name === "password") {
      // Check password length and show error
      if (value.length > 0 && value.length < 6) {
        setPasswordError("Password must be at least 6 characters");
      } else {
        setPasswordError("");
      }
      // Check password strength for password field
      setPasswordStrength(checkPasswordStrength(value));
    }

    // Remove password strength check from confirm password
    if (name === "confirmPassword") {
      // Only validate if passwords match
      if (value !== formData.password) {
        setError("Passwords do not match");
      } else {
        setError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate email before submission
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            gender: formData.gender,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Show success message
      setSuccess(true);
      // Redirect to login page after 3 seconds to ensure the success message is visible
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during signup");
    } finally {
      setLoading(false);
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
    if (fieldName === "password") {
      setPasswordError("");
    }
    if (fieldName === "confirmPassword") {
      setPasswordStrength({ score: 0, message: "", color: "" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center p-4 pt-20 pb-16">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <i className="fa-solid fa-heart-pulse text-3xl text-indigo-600"></i>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CampusVotes
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Create Your Account</h1>
            <p className="text-sm text-gray-600 mt-2">Join the most exciting campus community</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              Account created successfully! Redirecting to login page...
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
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    className={`w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-14 ${
                      passwordError ? "border-red-500" : ""
                    }`}
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
                {formData.password && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.score <= 1
                            ? "bg-red-500"
                            : passwordStrength.score === 2
                            ? "bg-orange-500"
                            : passwordStrength.score === 3
                            ? "bg-yellow-500"
                            : passwordStrength.score === 4
                            ? "bg-green-500"
                            : "bg-green-600"
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="mt-1.5">
                      <p className={`text-xs ${passwordStrength.color}`}>
                        {passwordStrength.message}
                      </p>
                      {passwordError && (
                        <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 pr-14"
                  required
                />
                <div className="absolute right-0 top-0 h-full flex items-center pr-2 gap-0.5">
                  {formData.confirmPassword && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => clearField("confirmPassword")}
                        className="text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium text-gray-700">
                Gender
              </label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, gender: value }))
                }
              >
                <SelectTrigger className="w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{" "}
                <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white text-sm py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
} 