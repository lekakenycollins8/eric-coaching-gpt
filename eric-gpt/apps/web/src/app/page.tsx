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
import WelcomeHero from '@/components/dashboard/WelcomeHero';
import FeaturedContent from '@/components/dashboard/FeaturedContent';
import Link from 'next/link';
import { 
  ClipboardDocumentCheckIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  CreditCardIcon 
} from '@heroicons/react/24/outline';

export default function Home() {
  const { data: session } = useSession();
  
  // If user is authenticated, show a dashboard-like homepage
  if (session) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Welcome Hero Section */}
            <div className="mb-8">
              <WelcomeHero />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Featured Content */}
              <div className="lg:col-span-2">
                <FeaturedContent />
              </div>
              
              {/* Right column - Quick Links */}
              <div className="space-y-6">
                {/* Quick Actions Card */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-4">
                    <div className="grid grid-cols-1 gap-4">
                      <Link href="/dashboard/worksheets" className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-600" />
                        <span className="ml-3 text-sm font-medium text-gray-900">Complete a Worksheet</span>
                      </Link>                     
                      <Link href="/dashboard/subscription" className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                        <CreditCardIcon className="h-6 w-6 text-green-600" />
                        <span className="ml-3 text-sm font-medium text-gray-900">Manage Subscription</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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