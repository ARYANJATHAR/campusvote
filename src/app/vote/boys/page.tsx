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

export default function BoysVotePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPair, setCurrentPair] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        router.push('/dashboard');
        return;
      }
    };

    const fetchProfiles = async () => {
      try {
        // Fetch female profiles for male users
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('gender', 'female');

        if (error) throw error;
        setProfiles(data || []);
        // Set initial pair
        if (data && data.length >= 2) {
          setCurrentPair([data[0], data[1]]);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchProfiles();
  }, [supabase, router]);

  const getNextPair = () => {
    const remainingProfiles = profiles.filter(
      profile => !currentPair.some(p => p.id === profile.id)
    );
    
    if (remainingProfiles.length >= 2) {
      setCurrentPair([remainingProfiles[0], remainingProfiles[1]]);
    } else {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Vote for Your Favorite</h1>
            <p className="text-sm text-gray-600">Click to vote for your favorite profile</p>
          </div>

          {currentPair.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">No more profiles to vote!</h2>
              <p className="text-gray-600 mb-6">Check back later for more profiles to vote on.</p>
              <Button
                onClick={() => router.push('/leaderboard')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                View Leaderboard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentPair.map((profile) => (
                <Card 
                  key={profile.id} 
                  className="w-full p-3 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                      <img
                        src={profile.profile_image || '/default-avatar.png'}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <h2 className="text-base font-bold text-gray-800">{profile.name}</h2>
                        <p className="text-xs text-gray-600">{profile.age} years old</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-graduation-cap text-purple-600 text-sm"></i>
                          <span className="text-xs text-gray-700">{profile.college_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-book text-purple-600 text-sm"></i>
                          <span className="text-xs text-gray-700">{profile.education}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-calendar text-purple-600 text-sm"></i>
                          <span className="text-xs text-gray-700">{profile.year}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-location-dot text-purple-600 text-sm"></i>
                          <span className="text-xs text-gray-700">
                            {profile.city}, {profile.state}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-medium text-gray-700 mb-1">Hobbies & Interests</h3>
                        <div className="flex flex-wrap gap-1">
                          {profile.hobbies.split(", ").map((hobby: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-[10px]">
                              {hobby}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleVote(profile.id)}
                        className="w-full h-8 text-sm bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <i className="fa-solid fa-heart mr-2"></i> Vote
                      </Button>
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