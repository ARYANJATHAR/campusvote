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

export default function GirlsVotePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPair, setCurrentPair] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState<{[key: string]: boolean}>({});
  const [imagesReady, setImagesReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewedProfiles, setViewedProfiles] = useState<string[]>([]);
  const [viewedPairs, setViewedPairs] = useState<Set<string>>(new Set());
  const [allPairsViewed, setAllPairsViewed] = useState(false);
  const [nextPair, setNextPair] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

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

  // Optimized image preloading
  const preloadImages = useCallback((profiles: any[]) => {
    profiles.forEach(profile => {
      if (profile.profile_image && !preloadedImages.has(profile.profile_image)) {
        const img = new window.Image();
        img.src = profile.profile_image;
        setPreloadedImages(prev => new Set([...prev, profile.profile_image]));
      }
    });
  }, [preloadedImages]);

  // Preload next batch of images
  const preloadNextBatch = useCallback(() => {
    if (profiles.length < 2) return;

    // Get next 4 profiles that haven't been viewed
    const remainingProfiles = profiles.filter(profile => 
      !viewedProfiles.includes(profile.id)
    ).slice(0, 4);

    if (remainingProfiles.length > 0) {
      preloadImages(remainingProfiles);
    }
  }, [profiles, viewedProfiles, preloadImages]);

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
        
        // Preload initial pair images and next batch
        preloadImages(initialPair);
        preloadNextBatch();
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to fetch profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [supabase, preloadImages, preloadNextBatch]);

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

  const handleProfileClick = async (profile: any) => {
    if (isVoting) return; // Prevent multiple votes while processing
    setIsVoting(true);
    
    // Removed loading toast
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

      // Clear any existing toasts first
      toast.dismiss();
      
      // Show only one success toast with shorter duration
      toast.success('Vote recorded successfully!', {
        duration: 1000, // 1 second duration
        className: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold',
      });

      // Get next pair after voting is complete (removed setTimeout)
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
      const remainingProfiles = shuffleArray([...profiles]);
      
      if (remainingProfiles.length < 2) break;
      
      const profile1 = remainingProfiles[0];
      const profile2 = remainingProfiles[1];
      const pairIds = [profile1.id, profile2.id].sort();
      const pairKey = `${pairIds[0]}-${pairIds[1]}`;
      
      if (!viewedPairs.has(pairKey)) {
        setNextPair([profile1, profile2]);
        // Preload images
        [profile1, profile2].forEach(profile => {
          if (profile.profile_image) {
            const img = new window.Image();
            img.src = profile.profile_image;
          }
        });
        break;
      }
    }
  }, [profiles, viewedPairs]);

  useEffect(() => {
    if (currentPair.length === 2) {
      // Reset image loading state when current pair changes
      setImagesReady(false);
      setImageLoading({
        [currentPair[0].id]: true,
        [currentPair[1].id]: true
      });
      
      // Preload next batch of images
      preloadNextBatch();
    }
  }, [currentPair, preloadNextBatch]);

  const handleImageLoad = (profileId: string) => {
    setImageLoading(prev => {
      const newState = {
        ...prev,
        [profileId]: false
      };
      
      // Check if all images in the current pair are loaded
      if (currentPair.length === 2 && 
          !newState[currentPair[0].id] && 
          !newState[currentPair[1].id]) {
        // Small delay to ensure smooth transition
        setTimeout(() => setImagesReady(true), 100);
      }
      
      return newState;
    });
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
            <p className="text-gray-600">Click on the profile to vote</p>
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
                  className="w-full p-4 bg-white/80 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleProfileClick(profile)}
                >
                  <div className="flex flex-col gap-4">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden ring-2 ring-indigo-100">
                      <div className={`absolute inset-0 bg-gray-100 animate-pulse ${!imageLoading[profile.id] ? 'hidden' : ''}`} />
                      <Image
                        src={profile.profile_image || '/default-avatar.png'}
                        alt={profile.name}
                        fill
                        quality={85}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover transition-transform duration-300 hover:scale-105 ${
                          imagesReady ? 'opacity-100' : 'opacity-0'
                        }`}
                        priority={true}
                        onLoad={() => handleImageLoad(profile.id)}
                        loading="eager"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4dHRsdHR4dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDAR4WFiMeJR4lHR0lLiUdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
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
                        onClick={() => handleProfileClick(profile)}
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