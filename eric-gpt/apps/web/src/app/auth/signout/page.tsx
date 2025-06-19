'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function SignOut() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign out
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Are you sure you want to sign out of Eric GPT Coaching Platform?
          </p>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="group relative flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors"
          >
            Yes, Sign Out
          </button>
          <Link
            href="/dashboard"
            className="group relative flex justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
