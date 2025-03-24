"use client";

import "@fortawesome/fontawesome-free/css/all.min.css";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
        <Navbar />
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <CTA />
      </div>
    </ErrorBoundary>
  );
}
