"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientText } from "@/components/landing/GradientText";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userGender, setUserGender] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/register';


  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user?.user_metadata?.gender) {
        setUserGender(session.user.user_metadata.gender);
      }
    };
    getUserSession();
  }, [supabase.auth]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        setUserProfile(profile);
      }
    };

    getUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const getVoteLink = () => {
    if (userGender === 'male') return '/vote/boys';
    if (userGender === 'female') return '/vote/girls';
    return '/vote';
  };

  const getLeaderboardLink = () => {
    return '/leaderboard';  // Always return the common leaderboard page
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav 
      className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-heart-pulse text-2xl text-indigo-600 animate-pulse" aria-hidden="true"></i>
          <span className="text-xl font-bold">
            <GradientText className="bg-gradient-to-r from-indigo-600 to-purple-600">CampusVotes</GradientText>
          </span>
        </div>

        {/* Mobile menu button */}
        <button
          className={`md:hidden p-2 rounded-md text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 transition-all duration-300 ${isAuthPage ? 'hidden' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}></i>
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-8" role="menubar">
          {!isAuthPage && user ? (
            <>
              <Link href="/dashboard">
                <span className="text-indigo-600 hover:text-purple-600 cursor-pointer font-medium transition-colors duration-300 hover:scale-105">
                  Dashboard
                </span>
              </Link>
              <Link href={getVoteLink()}>
                <span className="text-indigo-600 hover:text-purple-600 cursor-pointer font-medium transition-colors duration-300 hover:scale-105">
                  Vote
                </span>
              </Link>
              <Link href={getLeaderboardLink()}>
                <span className="text-indigo-600 hover:text-purple-600 cursor-pointer font-medium transition-colors duration-300 hover:scale-105">
                  Leaderboard
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-indigo-600 hover:text-purple-600 cursor-pointer font-medium transition-colors duration-300 hover:scale-105"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/">
                <span className="text-indigo-600 hover:text-purple-600 cursor-pointer font-medium transition-colors duration-300 hover:scale-105">
                  <i className="fas fa-home mr-1"></i>Home
                </span>
              </Link>
              <Link href="/login">
                <GradientButton 
                  variant="outline"
                  aria-label="Login to your account"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Login
                </GradientButton>
              </Link>
              <Link href="/signup">
                <GradientButton
                  aria-label="Create a new account"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Sign Up
                </GradientButton>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} transition-all duration-300 ease-in-out`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
          {!isAuthPage && user ? (
            <>
              <Link 
                href="/dashboard"
                className="block px-3 py-2 text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 rounded-md font-medium transition-all duration-300 hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fas fa-chart-line mr-2"></i>Dashboard
              </Link>
              <Link 
                href={getVoteLink()}
                className="block px-3 py-2 text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 rounded-md font-medium transition-all duration-300 hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fas fa-heart mr-2"></i>Vote
              </Link>
              <Link 
                href={getLeaderboardLink()}
                className="block px-3 py-2 text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 rounded-md font-medium transition-all duration-300 hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fas fa-trophy mr-2"></i>Leaderboard
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 rounded-md font-medium transition-all duration-300 hover:scale-105"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>Sign Out
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/"
                className="block px-3 py-2 text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 rounded-md font-medium transition-all duration-300 hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fas fa-home mr-2"></i>Home
              </Link>
              <Link 
                href="/login" 
                className="block px-3 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <GradientButton 
                  variant="outline"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>Login
                </GradientButton>
              </Link>
              <Link 
                href="/signup" 
                className="block px-3 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <GradientButton
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <i className="fas fa-user-plus mr-2"></i>Sign Up
                </GradientButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 