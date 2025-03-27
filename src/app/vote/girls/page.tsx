"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GradientText } from "@/components/landing/GradientText";
import { GradientButton } from "@/components/ui/gradient-button";

export default function GirlsVotePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPair, setCurrentPair] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewedProfiles, setViewedProfiles] = useState<string[]>([]);
  const [viewedPairs, setViewedPairs] = useState<Set<string>>(new Set());
  const [allPairsViewed, setAllPairsViewed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Check if user is female
      const userGender = session.user.user_metadata?.gender;
      if (userGender !== 'female') {
        router.push('/dashboard');
        return;
      }

      // Only fetch profiles if authentication passes
      fetchProfiles();
    };

    checkAuth();
  }, [supabase, router]);

  // Fisher-Yates shuffle algorithm for randomizing profiles
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const fetchProfiles = useCallback(async () => {
    try {
      // Fetch all male profiles for female users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', 'male');

      if (error) throw error;
      
      // Shuffle the profiles
      const shuffledProfiles = shuffleArray(data || []);
      setProfiles(shuffledProfiles);
      
      // Set initial pair
      if (shuffledProfiles.length >= 2) {
        const initialPair = [shuffledProfiles[0], shuffledProfiles[1]];
        setCurrentPair(initialPair);
        setViewedProfiles([shuffledProfiles[0].id, shuffledProfiles[1].id]);
        // Add this pair to viewed pairs
        setViewedPairs(new Set([`${shuffledProfiles[0].id}-${shuffledProfiles[1].id}`]));
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to fetch profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const getNextPair = () => {
    // Check if all possible pairs have been viewed
    const totalProfiles = profiles.length;
    const totalPossiblePairs = (totalProfiles * (totalProfiles - 1)) / 2; // n*(n-1)/2 combinations
    
    if (viewedPairs.size >= totalPossiblePairs) {
      setAllPairsViewed(true);
      setCurrentPair([]);
      return;
    }
    
    // Try to find a pair that hasn't been viewed yet
    let attempts = 0;
    const maxAttempts = 50; // Limit attempts to prevent infinite loop
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Get two random profiles
      const remainingProfiles = shuffleArray([...profiles]);
      
      if (remainingProfiles.length < 2) break;
      
      const profile1 = remainingProfiles[0];
      const profile2 = remainingProfiles[1];
      
      // Create a unique identifier for this pair (sorted to ensure same pair in different order is considered the same)
      const pairIds = [profile1.id, profile2.id].sort();
      const pairKey = `${pairIds[0]}-${pairIds[1]}`;
      
      // Check if this pair has been viewed
      if (!viewedPairs.has(pairKey)) {
        // New pair found
        setCurrentPair([profile1, profile2]);
        setViewedPairs(new Set([...viewedPairs, pairKey]));
        return;
      }
    }
    
    // If we've exhausted all possibilities or attempts
    if (attempts >= maxAttempts) {
      setAllPairsViewed(true);
      setCurrentPair([]);
    }
  };

  const handleVote = async (profileId: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        toast.error('Authentication error. Please try logging in again.');
        router.push('/login');
        return;
      }
      if (!session) {
        toast.error('Please log in to vote');
        router.push('/login');
        return;
      }

      // Record the vote
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .insert({
          voter_id: session.user.id,
          voted_for_id: profileId,
          created_at: new Date().toISOString()
        })
        .select();

      if (voteError) {
        toast.error(`Error recording vote: ${voteError.message}`);
        return;
      }

      // Update the profile's vote count directly
      const currentProfile = profiles.find(p => p.id === profileId);
      const currentVotes = currentProfile?.votes || 0;
      
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ votes: currentVotes + 1 })
        .eq('id', profileId)
        .select();

      if (updateError) {
        toast.error(`Error updating vote count: ${updateError.message}`);
        return;
      }

      // Show success toast
      toast.success('Vote recorded!', {
        duration: 2000
      });

      // Get next pair after 1 second
      setTimeout(() => {
        getNextPair();
      }, 1000);

    } catch (error) {
      console.error('Error recording vote:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center p-4 pt-24">
          <div className="w-full max-w-5xl text-center bg-white/80 rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error Loading Profiles</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <GradientButton
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Try Again
            </GradientButton>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">
              <GradientText className="bg-gradient-to-r from-indigo-600 to-purple-600">
                Vote for Your Favorite
              </GradientText>
            </h1>
            <p className="text-gray-600">Click to vote for your favorite profile</p>
          </div>

          {currentPair.length === 0 ? (
            <div className="text-center py-12 bg-white/80 rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">No more profiles to vote!</h2>
              {allPairsViewed ? (
                <p className="text-gray-600 mb-6">You've seen all possible profile combinations. Please check back later for new profiles!</p>
              ) : (
                <p className="text-gray-600 mb-6">Check back later for more profiles to vote on.</p>
              )}
              <GradientButton
                onClick={() => router.push('/leaderboard')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <i className="fas fa-trophy mr-2"></i>
                View Leaderboard
              </GradientButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentPair.map((profile) => (
                <Card 
                  key={profile.id} 
                  className="w-full p-4 bg-white/80 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="flex flex-col gap-4">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden ring-2 ring-indigo-100">
                      <img
                        src={profile.profile_image || '/default-avatar.png'}
                        alt={profile.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">{profile.name}</h2>
                        <p className="text-sm text-gray-600">{profile.age} years old</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-graduation-cap text-indigo-600 text-sm"></i>
                          <span className="text-sm text-gray-700">{profile.college_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-book text-indigo-600 text-sm"></i>
                          <span className="text-sm text-gray-700">{profile.education}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-calendar text-indigo-600 text-sm"></i>
                          <span className="text-sm text-gray-700">{profile.year}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-location-dot text-indigo-600 text-sm"></i>
                          <span className="text-sm text-gray-700">
                            {profile.city}, {profile.state}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Hobbies & Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.hobbies.split(", ").map((hobby: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                              {hobby}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <GradientButton
                        onClick={() => handleVote(profile.id)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        <i className="fa-solid fa-heart mr-2"></i> Vote
                      </GradientButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 