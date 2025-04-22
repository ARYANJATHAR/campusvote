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
import { Profile, Vote, VoteState } from "@/types/profile";

export const dynamic = 'force-dynamic';

// Constants for rate limiting
const VOTE_LIMIT = 50; // Maximum votes per hour
const VOTE_COOLDOWN = 1000; // Minimum time between votes in milliseconds

export default function BoysVotePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentPair, setCurrentPair] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewedPairs, setViewedPairs] = useState<Set<string>>(new Set());
  const [viewedProfiles, setViewedProfiles] = useState<Set<string>>(new Set());
  const [allPairsViewed, setAllPairsViewed] = useState(false);
  const [nextPair, setNextPair] = useState<Profile[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [voteState, setVoteState] = useState<VoteState>({ voteCount: 0 });
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // Define fetchProfiles before using it in useEffect
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching female profiles...');

      // First, check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        router.push('/login');
        return;
      }

      // Fetch all female profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', 'female');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('No female profiles found');
        setError('No profiles available at the moment.');
        return;
      }

      console.log(`Found ${profilesData.length} female profiles`);

      // Fetch vote counts for each profile
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('voted_for_id');

      if (votesError) {
        console.error('Error fetching votes:', votesError);
      }

      // Count votes for each profile
      const voteCount = new Map();
      if (votesData) {
        votesData.forEach(vote => {
          const id = vote.voted_for_id;
          voteCount.set(id, (voteCount.get(id) || 0) + 1);
        });
      }

      // Process profiles and their vote counts
      const processedProfiles = profilesData.map(profile => ({
        ...profile,
        votes: voteCount.get(profile.id) || 0
      }));

      console.log('Processed profiles with vote counts');
      
      // Shuffle the profiles
      const shuffledProfiles = shuffleArray(processedProfiles);
      setProfiles(shuffledProfiles);
      
      // Set initial pair only if we don't have a current pair
      if (shuffledProfiles.length >= 2 && currentPair.length === 0) {
        const initialPair = generateRandomPair(shuffledProfiles);
        setCurrentPair(initialPair);
        
        if (initialPair.length === 2) {
          const pairKey = getPairKey(initialPair[0].id, initialPair[1].id);
          setViewedPairs(new Set([pairKey]));
          console.log('Initial pair set');
        }
      }
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
      setError('Failed to fetch profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPair.length, router]);

  // Subscribe to real-time vote updates
  useEffect(() => {
    const channel = supabase
      .channel('votes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'votes' 
        }, 
        (payload: { eventType: string; new?: Record<string, any> }) => {
          console.log("Vote event detected:", payload.eventType);
          // Only refresh profiles for votes from other users
          if (payload.new && payload.new.voter_id !== sessionUserId) {
            fetchProfiles();
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchProfiles, sessionUserId]);

  // Load saved state on component mount with improved persistence
  useEffect(() => {
    const loadSavedState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;
      setSessionUserId(userId);

      // Load all saved state from localStorage
      const savedState = localStorage.getItem(`votingState_boys_${userId}`);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setViewedPairs(new Set(parsedState.viewedPairs));
        setViewedProfiles(new Set(parsedState.viewedProfiles));
        setAllPairsViewed(parsedState.allPairsViewed);
        setVoteState(parsedState.voteState);
      }
    };

    loadSavedState();
  }, [supabase]);

  // Save complete state when it changes
  useEffect(() => {
    const saveCompleteState = async () => {
      if (!sessionUserId) return;

      const stateToSave = {
        viewedPairs: Array.from(viewedPairs),
        viewedProfiles: Array.from(viewedProfiles),
        allPairsViewed,
        voteState,
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem(`votingState_boys_${sessionUserId}`, JSON.stringify(stateToSave));
    };

    saveCompleteState();
  }, [viewedPairs, viewedProfiles, allPairsViewed, voteState, sessionUserId]);

  // Add debug logging to useEffect for auth check
  useEffect(() => {
    console.log('Checking authentication...');
    const checkAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.log('No session found, redirecting to login');
        router.push('/login');
        return;
      }

      // Check if user is male
      const userGender = session.user.user_metadata?.gender;
      console.log('User gender:', userGender);
      if (userGender !== 'male') {
        console.log('User is not male, redirecting to girls voting page');
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

      console.log('Auth check passed, fetching profiles...');
      fetchProfiles();
    };

    checkAuth();
  }, [supabase, router, fetchProfiles]);

  // Optimized shuffle using Fisher-Yates
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Helper function to get a unique pair key
  const getPairKey = (id1: string, id2: string) => {
    return [id1, id2].sort().join('-');
  };

  // Improved pair generation logic
  const generateRandomPair = (profilesList: Profile[]): Profile[] => {
    if (profilesList.length < 2) return [];

    // Calculate total possible pairs
    const totalProfiles = profilesList.length;
    const totalPossiblePairs = (totalProfiles * (totalProfiles - 1)) / 2;

    // If we've seen all possible pairs, return empty to trigger the all-viewed state
    if (viewedPairs.size >= totalPossiblePairs) {
      setAllPairsViewed(true);
      return [];
    }

    // Create all possible pairs that haven't been viewed
    const availablePairs: Profile[][] = [];
    for (let i = 0; i < profilesList.length; i++) {
      for (let j = i + 1; j < profilesList.length; j++) {
        const pairKey = getPairKey(profilesList[i].id, profilesList[j].id);
        // Only check if this exact pair combination has been seen
        if (!viewedPairs.has(pairKey)) {
          availablePairs.push([profilesList[i], profilesList[j]]);
        }
      }
    }

    // If no available pairs, we've seen them all
    if (availablePairs.length === 0) {
      setAllPairsViewed(true);
      return [];
    }

    // Return a random pair from available pairs
    const randomIndex = Math.floor(Math.random() * availablePairs.length);
    return availablePairs[randomIndex];
  };

  const getNextPair = () => {
    const pair = generateRandomPair(profiles);
    
    if (pair.length === 2) {
      setCurrentPair(pair);
      const pairKey = getPairKey(pair[0].id, pair[1].id);
      setViewedPairs(prev => new Set([...prev, pairKey]));
    } else {
      setCurrentPair([]);
      setAllPairsViewed(true);
    }
  };

  const handleProfileClick = async (profile: Profile) => {
    if (isVoting) return; // Prevent multiple votes while processing
    
    // Immediately set voting state to prevent double clicks
    setIsVoting(true);
    
    try {
      // Only keep a small cooldown to prevent spam clicking
      const now = Date.now();
      if (voteState.lastVoteTime && now - voteState.lastVoteTime < VOTE_COOLDOWN) {
        toast.error('Please wait a moment before voting again');
        setIsVoting(false);
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Authentication error. Please log in again.');
        router.push('/login');
        return;
      }

      // Get the other profile's ID from the current pair
      const otherProfileId = currentPair.find(p => p.id !== profile.id)?.id;
      if (!otherProfileId) {
        toast.error('Error identifying the comparison pair');
        return;
      }

      // Use the handle_vote function to process the vote atomically
      const { data, error: voteError } = await supabase.rpc('handle_vote', {
        p_voter_id: session.user.id,
        p_voted_for_id: profile.id,
        p_pair_profile_id: otherProfileId
      });

      if (voteError) {
        if (voteError.message.includes('duplicate')) {
          toast.error('You have already voted in this comparison');
        } else {
          toast.error(`Error recording vote: ${voteError.message}`);
        }
        return;
      }

      // Update vote state
      setVoteState(prev => ({
        lastVoteTime: now,
        voteCount: prev.voteCount + 1
      }));

      toast.success('Vote recorded successfully!', {
        duration: 1000,
        className: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold',
      });

      // Get next pair without fetching profiles since the subscription will handle updates
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