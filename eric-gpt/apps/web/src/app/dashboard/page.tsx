'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import QuotaDisplayClient from '@/components/dashboard/QuotaDisplayClient';
import WelcomeHero from '@/components/dashboard/WelcomeHero';
import PlatformGuide from '@/components/dashboard/PlatformGuide';
import UserStats from '@/components/dashboard/UserStats';
import FeaturedContent from '@/components/dashboard/FeaturedContent';
import { WorkbookCallToAction } from '@/components/jackier/WorkbookCallToAction';
import { JackierWorkbookHighlight } from '@/components/jackier/JackierWorkbookHighlight';

export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin?callbackUrl=/dashboard');
    },
  });

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Hero Section */}
        <WelcomeHero />
        
        {/* Original Workbook Call to Action - Full Width */}
        <WorkbookCallToAction className="mt-6" />
        
        {/* Enhanced Jackier Workbook Highlight - Full Width */}
        <JackierWorkbookHighlight className="mt-8" />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Guide */}
            <PlatformGuide />
            
            {/* Featured Worksheets */}
            <FeaturedContent />
          </div>
          
          {/* Sidebar - Right 1/3 */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Stats */}
            <UserStats />
            
            {/* Quota Display */}
            <QuotaDisplayClient />
            
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="border-t border-gray-200">
                <div className="divide-y divide-gray-200">
                  <Link href="/dashboard/worksheets" className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <p className="text-sm font-medium text-green-600">Start a Worksheet</p>
                      <p className="mt-1 text-sm text-gray-500">Complete a leadership assessment</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/submissions" className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <p className="text-sm font-medium text-green-600">View Submissions</p>
                      <p className="mt-1 text-sm text-gray-500">Review your past work and feedback</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/subscription" className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <p className="text-sm font-medium text-green-600">Manage Subscription</p>
                      <p className="mt-1 text-sm text-gray-500">Update your plan or payment details</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <div className="flex justify-end">
              <Link
                href="/api/auth/signout"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
