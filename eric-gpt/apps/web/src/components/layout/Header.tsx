import React from 'react';
import Link from 'next/link';

// This is a placeholder header component
// It will be expanded in later sprints
export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-2xl font-bold text-green-600">
                Eric GPT
              </Link>
            </div>
            <nav className="ml-6 flex items-center space-x-4">
              <Link href="/worksheets" className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-green-600">
                Worksheets
              </Link>
              <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-green-600">
                Pricing
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <Link href="/auth/signin" className="ml-4 px-3 py-2 text-sm font-medium text-gray-900 hover:text-green-600">
              Sign In
            </Link>
            <Link 
              href="/auth/signin" 
              className="ml-4 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
