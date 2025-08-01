import { useState, useCallback, useEffect } from 'react';
import { Profile } from '@/types/profile';
import { useProfiles } from './use-profiles';
import { useVotes, useVoteLocalState } from './use-votes';

// Helper to generate a pair key
const getPairKey = (id1: string, id2: string) => {
  return [id1, id2].sort().join('_');
};

// Helper function to find the first unseen pair using exhaustive search
const findFirstUnseenPair = (
  profilesList: Profile[], 
  viewedPairs: Set<string>
): Profile[] => {
  for (let i = 0; i < profilesList.length; i++) {
    for (let j = i + 1; j < profilesList.length; j++) {
      const pairKey = getPairKey(profilesList[i].id, profilesList[j].id);
      if (!viewedPairs.has(pairKey)) {
        return [profilesList[i], profilesList[j]];
      }
    }
  }
  return []; // All pairs viewed
};

// Generate a random pair from profiles list
const generateRandomPair = (
  profilesList: Profile[], 
  viewedPairs: Set<string>,
  viewedProfiles: Set<string>,
  maxAttempts = 10
): Profile[] => {
  // If we have fewer than 2 profiles, we can't make a pair
  if (profilesList.length < 2) return [];
  
  // If most profiles are viewed, do a more thorough search
  const availableProfiles = profilesList.filter(p => !viewedProfiles.has(p.id));
  if (availableProfiles.length < 2) {
    return findFirstUnseenPair(profilesList, viewedPairs);
  }
  
  // Try to find a random pair that hasn't been viewed yet
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const idx1 = Math.floor(Math.random() * profilesList.length);
    let idx2 = Math.floor(Math.random() * profilesList.length);
    
    // Make sure we don't pick the same profile twice
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * profilesList.length);
    }
    
    const profile1 = profilesList[idx1];
    const profile2 = profilesList[idx2];
    const pairKey = getPairKey(profile1.id, profile2.id);
    
    // If this pair hasn't been viewed, return it
    if (!viewedPairs.has(pairKey)) {
      return [profile1, profile2];
    }
  }
  
  // If we couldn't find an unseen pair after maxAttempts, use exhaustive search
  return findFirstUnseenPair(profilesList, viewedPairs);
  
  return []; // All pairs viewed
};

export function useProfilePairs(gender: 'male' | 'female', userId: string | null) {
  const { profiles, isLoading, isError, error, mutate } = useProfiles(gender);
  const { submitVote, isVoting } = useVotes();
  const { 
    viewedPairs, 
    viewedProfiles, 
    allPairsViewed,
    loadSavedState,
    saveState,
    addViewedPair,
    markAllPairsViewed,
    resetViewedPairs
  } = useVoteLocalState(userId);
  
  const [currentPair, setCurrentPair] = useState<Profile[]>([]);
  const [nextPair, setNextPair] = useState<Profile[]>([]);
  
  // Load saved state when userId changes
  useEffect(() => {
    if (userId) {
      loadSavedState();
    }
  }, [userId, loadSavedState]);
  
  // Save state when viewed pairs changes
  useEffect(() => {
    saveState();
  }, [viewedPairs, viewedProfiles, allPairsViewed, saveState]);
  
  // Set initial pair when profiles load
  useEffect(() => {
    if (!isLoading && !isError && profiles.length >= 2 && currentPair.length === 0 && !allPairsViewed) {
      const initialPair = generateRandomPair(profiles, viewedPairs, viewedProfiles);
      
      if (initialPair.length === 2) {
        setCurrentPair(initialPair);
        addViewedPair(initialPair[0].id, initialPair[1].id);
        // Also prepare the next pair
        const nextRandomPair = generateRandomPair(profiles, viewedPairs, viewedProfiles);
        setNextPair(nextRandomPair);
        
        // If we couldn't generate a next pair, all pairs must be viewed
        if (nextRandomPair.length === 0) {
          markAllPairsViewed();
        }
      } else {
        // If we couldn't generate an initial pair, all pairs must be viewed
        markAllPairsViewed();
      }
    }
  }, [
    isLoading, 
    isError, 
    profiles, 
    currentPair.length, 
    viewedPairs, 
    viewedProfiles,
    allPairsViewed,
    addViewedPair,
    markAllPairsViewed
  ]);
  
  // Get the next pair
  const getNextPair = useCallback(() => {
    if (nextPair.length === 2) {
      // Use the pre-generated next pair
      setCurrentPair(nextPair);
      addViewedPair(nextPair[0].id, nextPair[1].id);
      
      // Generate a new next pair
      const newNextPair = generateRandomPair(profiles, viewedPairs, viewedProfiles);
      setNextPair(newNextPair);
      
      // If we couldn't generate a new next pair, all pairs must be viewed
      if (newNextPair.length === 0) {
        markAllPairsViewed();
      }
      
      return true;
    } else if (nextPair.length === 0 && !allPairsViewed) {
      // Try to generate a new current pair directly
      const newPair = generateRandomPair(profiles, viewedPairs, viewedProfiles);
      
      if (newPair.length === 2) {
        setCurrentPair(newPair);
        addViewedPair(newPair[0].id, newPair[1].id);
        return true;
      } else {
        markAllPairsViewed();
        return false;
      }
    }
    
    return false;
  }, [
    nextPair, 
    profiles, 
    viewedPairs, 
    viewedProfiles, 
    allPairsViewed,
    addViewedPair,
    markAllPairsViewed
  ]);
  
  // Handle voting for a profile
  const handleVote = useCallback(async (profile: Profile) => {
    if (isVoting) return false;
    
    try {
      const result = await submitVote(profile.id);
      
      if (result.success) {
        // Refresh the profiles data to get updated vote counts
        await mutate();
        
        // Get the next pair
        return getNextPair();
      }
      
      return false;
    } catch (error) {
      console.error('Error voting for profile:', error);
      return false;
    }
  }, [isVoting, submitVote, mutate, getNextPair]);
  
  // Reset all voting state
  const resetVoting = useCallback(() => {
    resetViewedPairs();
    setCurrentPair([]);
    setNextPair([]);
  }, [resetViewedPairs]);
  
  return {
    currentPair,
    nextPair,
    allPairsViewed,
    isLoading,
    isError,
    error,
    isVoting,
    viewedPairsCount: viewedPairs.size,
    handleVote,
    getNextPair,
    resetVoting,
  };
} 