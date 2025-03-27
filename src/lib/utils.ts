import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function calculateUserRank(userId: string, gender: 'male' | 'female') {
  const supabase = createClient()
  
  try {
    // Get all profiles of the same gender ordered by votes
    const { data: rankings, error } = await supabase
      .from("profiles")
      .select("id, votes")
      .eq("gender", gender)
      .order("votes", { ascending: false })

    if (error) throw error

    // Find the user's position in the rankings
    const rank = rankings.findIndex((p: { id: string }) => p.id === userId) + 1
    return rank
  } catch (error) {
    console.error("Error calculating rank:", error)
    return null
  }
}

// Function to get real-time rank updates
export function subscribeToRankUpdates(userId: string, gender: 'male' | 'female', onRankChange: (newRank: number) => void) {
  const supabase = createClient()
  
  // Subscribe to profile changes
  const subscription = supabase
    .channel('rank_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `gender=eq.${gender}`
      },
      async () => {
        // Recalculate rank when any profile's votes change
        const newRank = await calculateUserRank(userId, gender)
        if (newRank) {
          onRankChange(newRank)
        }
      }
    )
    .subscribe()

  return subscription
}
