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
import { WorkbookCallToAction } from '@/components/jackier/WorkbookCallToAction';
import { JackierWorkbookHighlight } from '@/components/jackier/JackierWorkbookHighlight';
import Link from 'next/link';
import { useState } from 'react';
import { 
  ClipboardDocumentCheckIcon, 
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const { data: session } = useSession();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
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
            
            {/* Jackier Workbook Call to Action - Full Width */}
            <WorkbookCallToAction className="mb-8" />
            
            {/* Jackier Workbook Highlight - Full Width */}
            <JackierWorkbookHighlight className="mb-8" />
            
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
                      
                      <button 
                        onClick={() => setShowSignOutModal(true)}
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 w-full text-left"
                      >
                        <ArrowRightOnRectangleIcon className="h-6 w-6 text-green-600" />
                        <span className="ml-3 text-sm font-medium text-gray-900">Sign Out</span>
                      </button>
                      
                      {/* Sign Out Confirmation Modal */}
                      {showSignOutModal && (
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-medium text-gray-900">Sign out</h3>
                              <button 
                                onClick={() => setShowSignOutModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                              >
                                <XMarkIcon className="h-6 w-6" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-6">
                              Are you sure you want to sign out?
                            </p>
                            <div className="flex justify-center space-x-4">
                              <Link
                                href="/api/auth/signout"
                                className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                              >
                                Sign out
                              </Link>
                              <button
                                onClick={() => setShowSignOutModal(false)}
                                className="inline-flex justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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