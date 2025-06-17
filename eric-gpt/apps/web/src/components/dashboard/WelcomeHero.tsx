'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function WelcomeHero() {
  const { data: session } = useSession();
  
  // Get user's name if available
  const userName = session?.user?.name || 'there';
  
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-8 sm:p-10">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="ml-4 text-2xl font-bold text-white">Hello {userName}, Welcome to Coach Eric GPT</h2>
        </div>
        <p className="mt-4 text-lg text-white opacity-90">
          Your leadership coaching journey begins here. Discover insights, track your progress, and grow your leadership skills.
        </p>
        <div className="mt-6">
          <Link 
            href="/dashboard/worksheets" 
            className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-700 focus:ring-white"
          >
            Start Your First Worksheet
            <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
