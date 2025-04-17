import { useSupabase } from '@/components/providers/supabase-provider'

export const useAuth = () => {
  const { user, session, signOut, signInWithEmail, signUpWithEmail } = useSupabase()

  return {
    user,
    session,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    isAuthenticated: !!user,
  }
} 