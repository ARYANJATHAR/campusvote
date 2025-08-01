import useSWR from 'swr';
import { createClient } from '@/lib/supabase-client';
import { Profile } from '@/types/profile';
import { useEffect } from 'react';

// Create a reusable fetcher function
const fetchProfiles = async (key: string) => {
  // Parse the key to extract the gender parameter
  const [_, gender] = key.split('/');
  
  const supabase = createClient();
  
  // First check the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Authentication required');
  }
  
  // Fetch profiles by gender
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .eq('gender', gender);
    
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }
  
  if (!profilesData || profilesData.length === 0) {
    return [];
  }
  
  // Fetch vote counts for each profile
  const { data: votesData, error: votesError } = await supabase
    .from('votes')
    .select('voted_for_id');
    
  if (votesError) {
    console.error('Error fetching votes:', votesError);
    throw votesError;
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
  return profilesData.map(profile => ({
    ...profile,
    votes: voteCount.get(profile.id) || 0
  }));
};

// Randomize an array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function useProfiles(gender: 'male' | 'female') {
  const { data, error, mutate } = useSWR(`/profiles/${gender}`, fetchProfiles, {
    revalidateOnFocus: false, // Don't fetch again when window regains focus
    revalidateOnReconnect: true, // Revalidate when browser regains connection
    refreshInterval: 0, // Don't poll for data
    dedupingInterval: 5000, // Don't make the same request within 5 seconds
  });
  
  return {
    profiles: data ? shuffleArray(data) : [], // Shuffle profiles to randomize display
    isLoading: !error && !data,
    isError: !!error,
    error,
    mutate, // Function to manually revalidate data
  };
}

// Hook for subscribing to real-time updates
export function useProfilesSubscription(userId: string | null, mutate: () => void) {
  const supabase = createClient();
  
  useEffect(() => {
    if (!userId) return;
    
    // Subscribe to votes table changes
    const channel = supabase
      .channel('votes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'votes' }, 
        (payload: { eventType: string; new?: Record<string, any> }) => {
          // Only refresh profiles for votes from other users
          if (payload.new && payload.new.voter_id !== userId) {
            mutate(); // Trigger revalidation
          }
        })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, mutate]);
} 