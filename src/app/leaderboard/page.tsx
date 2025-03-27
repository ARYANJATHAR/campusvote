"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { GradientText } from "@/components/landing/GradientText";
import { GradientButton } from "@/components/ui/gradient-button";
import { calculateUserRank } from "@/lib/utils";
import { toast } from "sonner";

export default function Leaderboard() {
  const supabase = createClient();
  const router = useRouter();
  const [userGender, setUserGender] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'boys' | 'girls'>('boys');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo data for testing
  const demoData = [
    {
      id: 1,
      name: "John Smith",
      profile_image: "https://i.pravatar.cc/150?img=1",
      votes: 150,
      gender: "male"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      profile_image: "https://i.pravatar.cc/150?img=2",
      votes: 145,
      gender: "female"
    },
    {
      id: 3,
      name: "Mike Wilson",
      profile_image: "https://i.pravatar.cc/150?img=3",
      votes: 130,
      gender: "male"
    },
    {
      id: 4,
      name: "Emma Davis",
      profile_image: "https://i.pravatar.cc/150?img=4",
      votes: 125,
      gender: "female"
    },
    {
      id: 5,
      name: "David Brown",
      profile_image: "https://i.pravatar.cc/150?img=5",
      votes: 120,
      gender: "male"
    }
  ];

  const getLeaderboardData = async () => {
    try {
      setIsRefreshing(true);
      setLoading(true);
      console.log('Fetching fresh leaderboard data...');
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, name, profile_image, votes, gender")
        .order("votes", { ascending: false })
        .limit(20)
        .throwOnError();

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return;
      }

      // Sort profiles by votes in descending order
      const sortedProfiles = profiles?.sort((a, b) => b.votes - a.votes) || [];
      
      console.log('New leaderboard data:', sortedProfiles.map(p => ({
        name: p.name,
        votes: p.votes
      })));
      
      setLeaderboardData(sortedProfiles);
    } catch (error) {
      console.error("Error in getLeaderboardData:", error);
      toast.error("Failed to fetch leaderboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await getLeaderboardData();
  };

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

    // Set up real-time subscription
    const subscription = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          getLeaderboardData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredData = leaderboardData
    .filter(profile => profile.gender === (selectedGender === 'boys' ? 'male' : 'female'))
    .sort((a, b) => b.votes - a.votes)
    .map((profile, index) => ({
      ...profile,
      rank: index + 1
    }));

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
                      {filteredData.map((student) => (
                        <tr key={student.id} className="hover:bg-indigo-50/50 transition-colors duration-300">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            {student.rank}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-full ring-2 ring-indigo-100 transition-transform duration-300 hover:scale-110"
                                  src={student.profile_image || "https://via.placeholder.com/40"}
                                  alt=""
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