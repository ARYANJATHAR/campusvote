"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    };

    const fetchProfiles = async () => {
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
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError('Failed to fetch profiles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchProfiles();
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

  const getNextPair = () => {
    // If all profiles have been viewed, reset the viewed profiles
    if (viewedProfiles.length >= profiles.length) {
      setViewedProfiles([]);
      const reshuffledProfiles = shuffleArray(profiles);
      setProfiles(reshuffledProfiles);
      
      if (reshuffledProfiles.length >= 2) {
        setCurrentPair([reshuffledProfiles[0], reshuffledProfiles[1]]);
        setViewedProfiles([reshuffledProfiles[0].id, reshuffledProfiles[1].id]);
      } else {
        setCurrentPair([]);
      }
      return;
    }

    // Get profiles that haven't been viewed yet
    const remainingProfiles = profiles.filter(
      profile => !viewedProfiles.includes(profile.id)
    );
    
    if (remainingProfiles.length >= 2) {
      const nextPair = [remainingProfiles[0], remainingProfiles[1]];
      setCurrentPair(nextPair);
      setViewedProfiles([...viewedProfiles, remainingProfiles[0].id, remainingProfiles[1].id]);
    } else if (remainingProfiles.length === 1) {
      // Find a profile that hasn't been shown recently (at least 2 sets ago)
      const olderViewedProfiles = viewedProfiles.slice(0, viewedProfiles.length - 4);
      if (olderViewedProfiles.length > 0) {
        // Randomly select one of the older viewed profiles
        const randomIndex = Math.floor(Math.random() * olderViewedProfiles.length);
        const randomOldProfileId = olderViewedProfiles[randomIndex];
        const randomOldProfile = profiles.find(p => p.id === randomOldProfileId);
        
        if (randomOldProfile) {
          setCurrentPair([remainingProfiles[0], randomOldProfile]);
          setViewedProfiles([...viewedProfiles, remainingProfiles[0].id]);
        } else {
          setCurrentPair([]);
        }
      } else {
        setCurrentPair([]);
      }
    } else {
      // Reset and start over with reshuffled profiles
      const reshuffledProfiles = shuffleArray(profiles);
      setProfiles(reshuffledProfiles);
      setViewedProfiles([]);
      
      if (reshuffledProfiles.length >= 2) {
        setCurrentPair([reshuffledProfiles[0], reshuffledProfiles[1]]);
        setViewedProfiles([reshuffledProfiles[0].id, reshuffledProfiles[1].id]);
      } else {
        setCurrentPair([]);
      }
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
        <Footer />
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
              <p className="text-gray-600 mb-6">Check back later for more profiles to vote on.</p>
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
      <Footer />
    </div>
  );
} 