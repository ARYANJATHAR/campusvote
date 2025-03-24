import Image from "next/image";
import { useState } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  image: string;
  icon: string;
  index: number;
  className?: string;
}

export function FeatureCard({ title, description, image, icon, index, className = "" }: FeatureCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-lg ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 animate-pulse"></div>
        )}
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            priority={index < 2}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
            <i className={`fas ${icon}`}></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
            {title}
          </h3>
        </div>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
        <div className="flex items-center text-indigo-600 font-medium group-hover:text-purple-600 transition-colors duration-300">
          <span>Learn more</span>
          <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
        </div>
      </div>
    </div>
  );
} 