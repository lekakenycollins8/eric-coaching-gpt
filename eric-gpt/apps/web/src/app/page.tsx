'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import AuthenticatedContent from '../components/auth/AuthenticatedContent';

export default function Home() {
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
          <Link
            href="/worksheets"
            className="p-6 mt-6 text-left border w-full md:w-96 rounded-xl hover:text-green-600 focus:text-green-600 hover:border-green-600 transition-colors"
          >
            <h3 className="text-2xl font-bold">Worksheets &rarr;</h3>
            <p className="mt-4 text-xl">
              Explore leadership worksheets from the 12 pillars
            </p>
          </Link>

          {/* Authentication-dependent content is isolated in a separate client component */}
          <AuthenticatedContent />
        </div>
      </main>
    </div>
  );
}