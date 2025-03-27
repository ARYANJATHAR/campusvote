"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
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
import Link from "next/link";
import { GradientText } from "@/components/landing/GradientText";
import { GradientButton } from "@/components/ui/gradient-button";
import { calculateUserRank, subscribeToRankUpdates } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface Profile {
  id: string;
  name: string;
  age: number;
  college_name: string;
  education: string;
  year: string;
  city: string;
  bio: string;
  hobbies: string;
  profile_image: string | null;
  votes: number;
  gender: string;
}

interface Stats {
  totalVotes: number;
  rank: number;
  votesToday: number;
  votesThisWeek: number;
}

interface RecentVoter {
  id: string;
  name: string;
  college: string;
  timestamp: string;
  profileImage: string | null;
}

export default function GirlsDashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [recentVoters, setRecentVoters] = useState<RecentVoter[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalVotes: 0,
    rank: 0,
    votesToday: 0,
    votesThisWeek: 0
  });
  
  const fetchStats = useCallback(async (userId: string) => {
    try {
      // Get total votes
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("votes")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // Get rank using the utility function
      const rank = await calculateUserRank(userId, 'female');
      if (!rank) throw new Error("Failed to calculate rank");

      // Get votes today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayVotes, error: todayError } = await supabase
        .from("votes")
        .select("id", { count: 'exact' })
        .eq("voted_for_id", userId)
        .gte("created_at", today.toISOString());

      if (todayError) throw todayError;

      // Get votes this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: weekVotes, error: weekError } = await supabase
        .from("votes")
        .select("id", { count: 'exact' })
        .eq("voted_for_id", userId)
        .gte("created_at", weekAgo.toISOString());

      if (weekError) throw weekError;

      setStats({
        totalVotes: profile?.votes || 0,
        rank,
        votesToday: todayVotes || 0,
        votesThisWeek: weekVotes || 0
      });

      // Subscribe to rank updates
      const subscription = subscribeToRankUpdates(userId, 'female', (newRank) => {
        setStats(prevStats => ({
          ...prevStats,
          rank: newRank
        }));
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch stats");
    }
  }, [supabase]);

  const fetchRecentVoters = useCallback(async (userId: string) => {
    try {
      // First get the votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('id, created_at, voter_id')
        .eq('voted_for_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (votesError) {
        console.error('Error fetching votes:', votesError.message);
        return;
      }

      if (!votes || votes.length === 0) {
        console.log('No recent votes found');
        setRecentVoters([]);
        return;
      }

      // Then get the voter profiles
      const voterIds = votes.map(vote => vote.voter_id);
      const { data: voters, error: votersError } = await supabase
        .from('profiles')
        .select('id, name, college_name, profile_image')
        .in('id', voterIds);

      if (votersError) {
        console.error('Error fetching voters:', votersError.message);
        return;
      }

      // Combine the data
      const formattedVoters: RecentVoter[] = votes.map(vote => {
        const voter = voters?.find(v => v.id === vote.voter_id);
        return {
          id: vote.id,
          name: voter?.name || 'Unknown Voter',
          college: voter?.college_name || 'Unknown College',
          timestamp: formatDate(new Date(vote.created_at)),
          profileImage: voter?.profile_image || null
        };
      });

      setRecentVoters(formattedVoters);
    } catch (error) {
      console.error('Error in fetchRecentVoters:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  }, [supabase]);

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Check if user is female
      const userGender = session.user.user_metadata?.gender;
      if (userGender !== 'female') {
        router.push('/dashboard');
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      // Add timestamp to profile image to ensure cache busting
      if (profile.profile_image) {
        const timestamp = new Date().getTime();
        const separator = profile.profile_image.includes('?') ? '&' : '?';
        profile.profile_image = `${profile.profile_image}${separator}t=${timestamp}`;
      }

      setUserProfile(profile);
      fetchStats(session.user.id);
      fetchRecentVoters(session.user.id);
    };

    getUserProfile();

    // Setup real-time subscription for the user ID from the session
    const setupSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const userId = session.user.id;
      
      const votesSubscription = supabase
        .channel('votes_changes_girls')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes',
            filter: `voted_for_id=eq.${userId}`
          },
          (payload) => {
            console.log('Votes update received:', payload);
            fetchStats(userId);
            fetchRecentVoters(userId);
          }
        )
        .subscribe();

      const profileSubscription = supabase
        .channel('profile_changes_girls')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            console.log('Profile update received:', payload);
            getUserProfile(); // This will refresh the profile data
          }
        )
        .subscribe();

      return { votesSubscription, profileSubscription };
    };

    // Set up subscriptions and store cleanup function
    let subscriptions: any;
    setupSubscriptions().then(subs => {
      subscriptions = subs;
    });

    // Cleanup function
    return () => {
      if (subscriptions) {
        subscriptions.votesSubscription?.unsubscribe();
        subscriptions.profileSubscription?.unsubscribe();
      }
    };
  }, [supabase, router, fetchStats, fetchRecentVoters]);  // Include the necessary dependencies

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Please complete your registration first.</p>
          <GradientButton
            onClick={() => router.push('/register')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Complete Registration
          </GradientButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-indigo-50 to-purple-50 p-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">
              <GradientText className="bg-gradient-to-r from-indigo-600 to-purple-600">
                Your Dashboard
              </GradientText>
            </h1>
            <p className="text-gray-600">Track your profile performance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            {userProfile && (
              <Card className="md:col-span-1 p-6 bg-white/80 backdrop-blur-md border border-gray-100 transition-all duration-300 hover:shadow-xl">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 ring-2 ring-indigo-100">
                    <img
                      src={userProfile.profile_image || '/default-avatar.png'}
                      alt={userProfile.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      key={userProfile.profile_image || 'default'}
                    />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{userProfile.name}</h2>
                  <p className="text-sm text-gray-600 mb-4">{userProfile.age} years old</p>
                  
                  <div className="w-full space-y-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm text-gray-700">{userProfile.college_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Book className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm text-gray-700">{userProfile.education}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm text-gray-700">{userProfile.year}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm text-gray-700">
                        {userProfile.city}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Book className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm text-gray-700">{userProfile.bio}</span>
                    </div>
                  </div>

                  <div className="mt-4 w-full">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Hobbies & Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.hobbies?.split(", ").map((hobby: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <GradientButton 
                    onClick={handleEditProfile}
                    className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </GradientButton>
                </div>
              </Card>
            )}

            {/* Stats and Recent Activity */}
            <div className="md:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-4 bg-white/80 backdrop-blur-md border border-gray-100 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Votes</p>
                      <h3 className="text-2xl font-bold text-gray-800">{stats.totalVotes}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white/80 backdrop-blur-md border border-gray-100 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Rank</p>
                      <h3 className="text-2xl font-bold text-gray-800">#{stats.rank}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white/80 backdrop-blur-md border border-gray-100 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Votes Today</p>
                      <h3 className="text-2xl font-bold text-gray-800">{stats.votesToday}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white/80 backdrop-blur-md border border-gray-100 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Votes This Week</p>
                      <h3 className="text-2xl font-bold text-gray-800">{stats.votesThisWeek}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-white/80 backdrop-blur-md border border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Votes</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentVoters.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">No votes yet</p>
                  ) : (
                    <div className="space-y-4">
                      {recentVoters.map((voter) => (
                        <div key={voter.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-2 ring-indigo-100">
                            {voter.profileImage ? (
                              <img src={voter.profileImage} alt={voter.name} className="w-full h-full object-cover" />
                            ) : (
                              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                {voter.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{voter.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {voter.college} • {voter.timestamp}
                            </p>
                          </div>
                          <Heart className="h-4 w-4 text-indigo-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-md border border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/vote/girls" className="w-full">
                      <GradientButton className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <Heart className="mr-2 h-4 w-4" />
                        Vote on Male Profiles
                      </GradientButton>
                    </Link>
                    <Link href="/leaderboard" className="w-full">
                      <GradientButton className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <BarChart2 className="mr-2 h-4 w-4" />
                        View Leaderboard
                      </GradientButton>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 