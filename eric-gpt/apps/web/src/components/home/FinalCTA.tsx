'use client';

import React from 'react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <div className="bg-green-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          <span className="block">Unlock Your Leadership Edge Today</span>
          <span className="block text-green-200">Start your journey with Eric GPT.</span>
        </h2>
        <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 space-x-4">
          <div className="inline-flex rounded-md shadow">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50"
            >
              Subscribe to Eric GPT
            </Link>
          </div>
          <div className="inline-flex rounded-md shadow">
            <a
              href="https://www.jackiercoaching.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
