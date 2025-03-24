import Link from "next/link";
import { useState } from "react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientText } from "./GradientText";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          className="md:hidden p-2 rounded-md text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 transition-all duration-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}></i>
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-8" role="menubar">
          <a 
            href="#how-it-works" 
            className="text-indigo-600 hover:text-purple-600 cursor-pointer font-medium transition-colors duration-300 hover:scale-105"
            role="menuitem"
            aria-label="How it works section"
          >
            How It Works
          </a>
          <a 
            href="#features" 
            className="text-indigo-600 hover:text-purple-600 cursor-pointer font-medium transition-colors duration-300 hover:scale-105"
            role="menuitem"
            aria-label="Features section"
          >
            Features
          </a>
          <a 
            href="#testimonials" 
            className="text-indigo-600 hover:text-purple-600 cursor-pointer font-medium transition-colors duration-300 hover:scale-105"
            role="menuitem"
            aria-label="Testimonials section"
          >
            Testimonials
          </a>
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
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} transition-all duration-300 ease-in-out`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
          <a 
            href="#how-it-works" 
            className="block px-3 py-2 text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 rounded-md font-medium transition-all duration-300 hover:scale-105"
            onClick={() => setIsMenuOpen(false)}
          >
            <i className="fas fa-info-circle mr-2"></i>How It Works
          </a>
          <a 
            href="#features" 
            className="block px-3 py-2 text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 rounded-md font-medium transition-all duration-300 hover:scale-105"
            onClick={() => setIsMenuOpen(false)}
          >
            <i className="fas fa-star mr-2"></i>Features
          </a>
          <a 
            href="#testimonials" 
            className="block px-3 py-2 text-indigo-600 hover:text-purple-600 hover:bg-indigo-50 rounded-md font-medium transition-all duration-300 hover:scale-105"
            onClick={() => setIsMenuOpen(false)}
          >
            <i className="fas fa-comments mr-2"></i>Testimonials
          </a>
          <Link href="/login" className="block px-3 py-2">
            <GradientButton 
              variant="outline"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-sign-in-alt mr-2"></i>Login
            </GradientButton>
          </Link>
          <Link href="/signup" className="block px-3 py-2">
            <GradientButton
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-user-plus mr-2"></i>Sign Up
            </GradientButton>
          </Link>
        </div>
      </div>
    </nav>
  );
} 