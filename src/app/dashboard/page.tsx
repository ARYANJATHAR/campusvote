"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Heart, 
  Users, 
  ChevronRight,
  BarChart2,
  Edit,
  User,
  GraduationCap,
  Book,
  Calendar,
  MapPin
} from "lucide-react";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentVotes, setRecentVotes] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const gender = session.user.user_metadata?.gender;
      setUserGender(gender);

      // First check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profile || profileError) {
        console.log("No profile found, redirecting to registration");
        router.push("/register");
        return;
      }

      // Only redirect based on gender if profile exists
      if (gender === 'male') {
        router.push('/dashboard/boys');
        return;
      } else if (gender === 'female') {
        router.push('/dashboard/girls');
        return;
      }

      setUserProfile(profile);
      
      // Mock data for recent votes and rank
      setRecentVotes([
        {
          id: 1,
          voterName: "John Doe",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          voterName: "Jane Smith",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ]);
      setUserRank(5);
      setLoading(false);
    };

    getUserProfile();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Please complete your registration first.</p>
          <Link
            href="/register"
            className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Complete Registration
          </Link>
        </div>
      </div>
    );
  }

  const getVoteLink = () => {
    if (userGender === 'male') return '/vote/boys';
    if (userGender === 'female') return '/vote/girls';
    return '/vote';
  };

  const getLeaderboardLink = () => {
    if (userGender === 'male') return '/leaderboard/boys';
    if (userGender === 'female') return '/leaderboard/girls';
    return '/leaderboard';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-purple-50 to-pink-50 p-4 pt-24">
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats and Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Votes</p>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{userProfile.total_votes || 0}</h3>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Heart className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Current Rank</p>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">#{userRank}</h3>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                      {recentVotes.map((vote) => (
                        <div key={vote.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Heart className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">{vote.voterName}</p>
                            <p className="text-xs text-gray-400">{formatDate(vote.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Profile Card */}
                <div className="lg:col-span-1">
                  <Card className="p-4 sm:p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden mx-auto">
                          <img
                            src={userProfile.profile_image || "https://via.placeholder.com/128"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md hover:bg-gray-50">
                          <i className="fas fa-camera text-gray-600"></i>
                        </button>
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">{userProfile.name}</h2>
                      <p className="text-sm text-gray-600 mb-4">{userProfile.university}</p>
                      <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                        Edit Profile
                      </button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 