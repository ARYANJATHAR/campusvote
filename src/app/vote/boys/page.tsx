"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GradientText } from "@/components/landing/GradientText";
import { GradientButton } from "@/components/ui/gradient-button";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default function BoysVotePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPair, setCurrentPair] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewedPairs, setViewedPairs] = useState<Set<string>>(new Set());
  const [allPairsViewed, setAllPairsViewed] = useState(false);
  const [nextPair, setNextPair] = useState<any[]>([]);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Check if user is male
      const userGender = session.user.user_metadata?.gender;
      if (userGender !== 'male') {
        router.push('/vote/girls');
        return;
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile || profileError) {
        console.log("No profile found, redirecting to registration");
        router.push('/register');
        return;
      }

      // Only fetch profiles if authentication passes and profile exists
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
      // Fetch all female profiles for male users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', 'female');

      if (error) throw error;
      
      // Shuffle the profiles
      const shuffledProfiles = shuffleArray(data || []);
      setProfiles(shuffledProfiles);
      
      // Set initial pair
      if (shuffledProfiles.length >= 2) {
        const initialPair = generateRandomPair(shuffledProfiles);
        setCurrentPair(initialPair);
        
        // Add this pair to viewed pairs
        const pairKey = getPairKey(initialPair[0].id, initialPair[1].id);
        setViewedPairs(new Set([pairKey]));
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to fetch profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Helper function to get a unique pair key
  const getPairKey = (id1: string, id2: string) => {
    return [id1, id2].sort().join('-');
  };

  // Generate a random pair from profiles
  const generateRandomPair = (profilesList: any[]) => {
    if (profilesList.length < 2) return [];
    
    const shuffled = shuffleArray([...profilesList]);
    return [shuffled[0], shuffled[1]];
  };

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
    const maxAttempts = 100; // Increase attempts to try harder to find unviewed pairs
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Get two random profiles
      const pair = generateRandomPair(profiles);
      
      if (pair.length < 2) break;
      
      // Create a unique identifier for this pair
      const pairKey = getPairKey(pair[0].id, pair[1].id);
      
      // Check if this pair has been viewed
      if (!viewedPairs.has(pairKey)) {
        // New pair found
        setCurrentPair(pair);
        setViewedPairs(prev => new Set([...prev, pairKey]));
        return;
      }
    }
    
    // If we've exhausted all possibilities or attempts
    if (attempts >= maxAttempts) {
      setAllPairsViewed(true);
      setCurrentPair([]);
    }
  };

  const handleProfileClick = async (profile: any) => {
    if (isVoting) return; // Prevent multiple votes while processing
    setIsVoting(true);
    
    await handleVote(profile.id);
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

      // Upsert the vote to avoid unique constraint violations
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .upsert({
          voter_id: session.user.id,
          voted_for_id: profileId,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'voter_id,voted_for_id',
          ignoreDuplicates: true
        })
        .select();

      if (voteError) {
        toast.error(`Error recording vote: ${voteError.message}`);
        return;
      }

      // Clear any existing toasts first
      toast.dismiss();
      
      // Show only one success toast with shorter duration
      toast.success('Vote recorded successfully!', {
        duration: 1000, // 1 second duration
        className: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold',
      });

      // Get next pair after voting is complete
      getNextPair();

    } catch (error) {
      console.error('Error recording vote:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsVoting(false);
    }
  };

  const preloadNextPair = useCallback(() => {
    if (profiles.length < 2) return;

    // Find next unviewed pair
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      const pair = generateRandomPair(profiles);
      
      if (pair.length < 2) break;
      
      const pairKey = getPairKey(pair[0].id, pair[1].id);
      
      if (!viewedPairs.has(pairKey)) {
        setNextPair(pair);
        break;
      }
    }
  }, [profiles, viewedPairs]);

  useEffect(() => {
    if (currentPair.length === 2) {
      preloadNextPair();
    }
  }, [currentPair, preloadNextPair]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4 pt-24">
          <div className="w-full max-w-5xl text-center bg-white/80 rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error Loading Profiles</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <GradientButton
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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
      <main className="flex-grow bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">
              <GradientText className="bg-gradient-to-r from-purple-600 to-pink-600">
                Vote for Your Favorite
              </GradientText>
            </h1>
            <p className="text-gray-600">Click on the profile to vote</p>
          </div>

          {currentPair.length === 0 ? (
            <div className="text-center py-12 bg-white/80 rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">No more votes!</h2>
              {allPairsViewed ? (
                <p className="text-gray-600 mb-6">You've seen all possible profile combinations.</p>
              ) : (
                <p className="text-gray-600 mb-6">Check back later for more profiles to vote on.</p>
              )}
              <GradientButton
                onClick={() => router.push('/leaderboard')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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
                  className="w-full p-4 bg-white/80 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleProfileClick(profile)}
                >
                  <div className="flex flex-col gap-4">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden ring-2 ring-purple-100">
                      <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                      <Image
                        src={profile.profile_image || '/default-avatar.png'}
                        alt={`${profile.name}'s photo`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={true}
                        quality={75}
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">{profile.name}</h2>
                        <p className="text-sm text-gray-600">{profile.age} years old</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-graduation-cap text-purple-600 text-sm"></i>
                          <span className="text-sm text-gray-700">{profile.college_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-book text-purple-600 text-sm"></i>
                          <span className="text-sm text-gray-700">{profile.education}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-calendar text-purple-600 text-sm"></i>
                          <span className="text-sm text-gray-700">{profile.year}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-location-dot text-purple-600 text-sm"></i>
                          <span className="text-sm text-gray-700">
                            {profile.city}, {profile.state}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Hobbies & Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.hobbies.split(", ").map((hobby: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-600 hover:bg-purple-100">
                              {hobby}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <GradientButton
                        onClick={() => handleProfileClick(profile)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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