import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Vote, VoteState } from '@/types/profile';

// Fetch a user's voting state (votes they've cast)
const fetchUserVotes = async (key: string) => {
  const [_, userId] = key.split('/');
  
  if (!userId) return { votes: [], voteState: { voteCount: 0 } };
  
  const supabase = createClient();
  
  // Fetch votes cast by this user
  const { data: votesData, error } = await supabase
    .from('votes')
    .select('*')
    .eq('voter_id', userId);
    
  if (error) {
    console.error('Error fetching user votes:', error);
    throw error;
  }
  
  return {
    votes: votesData || [],
    voteState: {
      voteCount: votesData?.length || 0,
      lastVoteTime: votesData?.length > 0 
        ? new Date(votesData[votesData.length - 1].created_at).getTime()
        : undefined
    }
  };
};

export function useVotes() {
  const supabase = createClient();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  
  // Get current user ID
  const getUserId = useCallback(async () => {
    if (sessionUserId) return sessionUserId;
    
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;
    setSessionUserId(userId);
    return userId;
  }, [supabase, sessionUserId]);
  
  // Get user votes with SWR
  const { data, error, mutate } = useSWR(
    () => sessionUserId ? `/votes/${sessionUserId}` : null,
    fetchUserVotes,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 seconds
    }
  );
  
  // Submit a vote
  const submitVote = useCallback(async (votedForId: string) => {
    setIsVoting(true);
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('Authentication required');
      
      // Check rate limiting
      const currentTime = Date.now();
      const lastVoteTime = data?.voteState?.lastVoteTime;
      
      if (lastVoteTime && currentTime - lastVoteTime < 1000) {
        throw new Error('Voting too quickly, please wait');
      }
      
      // Insert vote
      const { error } = await supabase
        .from('votes')
        .insert({
          voter_id: userId,
          voted_for_id: votedForId,
        });
        
      if (error) throw error;
      
      // Update local state immediately
      await mutate();
      
      return { success: true };
    } catch (error) {
      console.error('Error submitting vote:', error);
      return { success: false, error };
    } finally {
      setIsVoting(false);
    }
  }, [supabase, getUserId, data, mutate]);
  
  return {
    votes: data?.votes || [],
    voteState: data?.voteState || { voteCount: 0 },
    isLoading: !error && !data,
    isError: !!error,
    isVoting,
    error,
    submitVote,
    mutate,
  };
}

// Get local vote state from localStorage
export function useVoteLocalState(userId: string | null) {
  const [viewedPairs, setViewedPairs] = useState<Set<string>>(new Set());
  const [viewedProfiles, setViewedProfiles] = useState<Set<string>>(new Set());
  const [allPairsViewed, setAllPairsViewed] = useState(false);
  
  // Load saved state
  const loadSavedState = useCallback(() => {
    if (!userId) return;
    
    try {
      const savedState = localStorage.getItem(`votingState_boys_${userId}`);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setViewedPairs(new Set(parsedState.viewedPairs || []));
        setViewedProfiles(new Set(parsedState.viewedProfiles || []));
        setAllPairsViewed(parsedState.allPairsViewed || false);
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, [userId]);
  
  // Save state
  const saveState = useCallback(() => {
    if (!userId) return;
    
    try {
      const stateToSave = {
        viewedPairs: Array.from(viewedPairs),
        viewedProfiles: Array.from(viewedProfiles),
        allPairsViewed,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(`votingState_boys_${userId}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [userId, viewedPairs, viewedProfiles, allPairsViewed]);
  
  // Update viewed pairs
  const addViewedPair = useCallback((id1: string, id2: string) => {
    const pairKey = `${id1}_${id2}`;
    setViewedPairs(prev => new Set([...prev, pairKey]));
    setViewedProfiles(prev => new Set([...prev, id1, id2]));
  }, []);
  
  // Mark all pairs as viewed
  const markAllPairsViewed = useCallback(() => {
    setAllPairsViewed(true);
    saveState();
  }, [saveState]);
  
  // Reset viewed pairs
  const resetViewedPairs = useCallback(() => {
    setViewedPairs(new Set());
    setViewedProfiles(new Set());
    setAllPairsViewed(false);
    saveState();
  }, [saveState]);
  
  return {
    viewedPairs,
    viewedProfiles,
    allPairsViewed,
    loadSavedState,
    saveState,
    addViewedPair,
    markAllPairsViewed,
    resetViewedPairs,
  };
} 