"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { GradientText } from "@/components/landing/GradientText";
import { GradientButton } from "@/components/ui/gradient-button";
import { toast } from "sonner";
import Image from "next/image";
import { Profile } from "@/types/profile";

export default function Leaderboard() {
  const supabase = createClient();
  const router = useRouter();
  const [userGender, setUserGender] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'boys' | 'girls'>('boys');
  const [leaderboardData, setLeaderboardData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getLeaderboardData = async () => {
    try {
      setIsRefreshing(true);
      setLoading(true);
      
      console.log("Fetching leaderboard data for gender:", selectedGender);

      // Get profiles with their vote counts
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("gender", selectedGender === 'boys' ? 'male' : 'female')
        .order('votes', { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Fetched profiles:", profiles?.length || 0);
      setLeaderboardData(profiles || []);
    } catch (error) {
      console.error("Error in getLeaderboardData:", error);
      toast.error("Failed to fetch leaderboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load and gender check
  useEffect(() => {
    const getUserGender = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const gender = session.user.user_metadata?.gender;
      setUserGender(gender);
      if (gender) {
        setSelectedGender(gender === 'male' ? 'boys' : 'girls');
      }
    };

    getUserGender();
    getLeaderboardData();
  }, []);

  // Set up real-time subscription for profiles
  useEffect(() => {
    // Listen for profile changes
    const profilesChannel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          getLeaderboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [selectedGender]);

  // Refresh data when gender selection changes
  useEffect(() => {
    getLeaderboardData();
  }, [selectedGender]);

  const handleRefresh = () => {
    getLeaderboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getVoteLink = () => {
    if (userGender === 'male') return '/vote/boys';
    if (userGender === 'female') return '/vote/girls';
    return '/vote';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  <GradientText className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    Leaderboard
                  </GradientText>
                </h1>
                <div className="flex bg-indigo-50 p-1 rounded-lg w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedGender('boys')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      selectedGender === 'boys'
                        ? 'bg-white text-indigo-600 shadow-md hover:shadow-lg'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
                    }`}
                  >
                    <i className="fas fa-mars mr-2"></i>Boys
                  </button>
                  <button
                    onClick={() => setSelectedGender('girls')}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      selectedGender === 'girls'
                        ? 'bg-white text-indigo-600 shadow-md hover:shadow-lg'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
                    }`}
                  >
                    <i className="fas fa-venus mr-2"></i>Girls
                  </button>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all duration-300 flex items-center gap-2 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <Link href={getVoteLink()}>
                <GradientButton
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <i className="fas fa-heart mr-2"></i>
                  Vote Now
                </GradientButton>
              </Link>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                          Profile
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">
                          Votes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboardData.map((student, index) => (
                        <tr key={student.id} className="hover:bg-indigo-50/50 transition-colors duration-300">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            {index + 1}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 relative">
                                <Image
                                  src={student.profile_image || "/default-avatar.png"}
                                  alt={`${student.name}'s photo`}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover w-10 h-10"
                                  loading="lazy"
                                  sizes="40px"
                                  quality={75}
                                  placeholder="blur"
                                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSAyVC08MTY3LjIxPVFHUj5TTlBMYWRkX3R7g4OGbnFxkZ6kqKD/2wBDARUXFx4aHR4eHSQlH0AlJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.name}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                            {student.votes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 