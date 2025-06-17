'use client';

import { useSession } from 'next-auth/react';
import { 
  HeroSection,
  WhatIsEricGPT,
  HowItWorks,
  CoreFeatures,
  PricingPlans,
  FinalCTA
} from '@/components/home';
import AuthenticatedContent from '@/components/auth/AuthenticatedContent';

export default function Home() {
  const { data: session } = useSession();
  
  // If user is authenticated, show AuthenticatedContent component
  if (session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center flex-1 px-4 md:px-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold">
            Welcome to{" "}
            <span className="text-green-600">Eric GPT Coaching Platform</span>
          </h1>
          <p className="mt-3 text-xl md:text-2xl">
            AI-powered leadership coaching with the Jackier Method
          </p>
          
          <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6">
            <AuthenticatedContent />
          </div>
        </main>
      </div>
    );
  }
  
  // For non-authenticated users, show the marketing homepage
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <HeroSection />
        <WhatIsEricGPT />
        <HowItWorks />
        <CoreFeatures />
        <PricingPlans />
        <FinalCTA />
      </main>
    </div>
  );
}