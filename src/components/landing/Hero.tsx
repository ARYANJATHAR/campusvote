import Image from "next/image";
import Link from "next/link";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientText } from "./GradientText";
import { useState } from "react";

export function Hero() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gray-900">Vote for Your</span>{" "}
              <GradientText className="bg-gradient-to-r from-indigo-600 to-purple-600 animate-gradient">
                Campus Crush
              </GradientText>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Join the excitement of campus voting! Support your favorite candidates and make your voice heard in this thrilling competition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup">
                <GradientButton 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                >
                  <span className="flex items-center">
                    <i className="fas fa-user-plus mr-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                    Get Started
                  </span>
                </GradientButton>
              </Link>
              <Link href="/leaderboard">
                <GradientButton 
                  variant="outline"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                >
                  <span className="flex items-center">
                    <i className="fas fa-trophy mr-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                    View Leaderboard
                  </span>
                </GradientButton>
              </Link>
            </div>
          </div>

          {/* Right column - Image */}
          <div className="relative">
            <div className="relative aspect-[4/3] sm:aspect-[3/4] md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 animate-pulse"></div>
              )}
              <Image
                src="/Generated Image March 23, 2025 - 11_56PM.png.jpeg"
                alt="Campus voting illustration"
                fill
                className={`object-contain transition-opacity duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 