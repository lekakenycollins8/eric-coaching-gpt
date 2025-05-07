'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  
  // Only render authentication-dependent UI after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isAuthenticated = status === 'authenticated';

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
        
        {isClient && isAuthenticated && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
            <p className="text-green-800 font-medium">Welcome back, {session?.user?.email}!</p>
            <Link 
              href="/dashboard"
              className="mt-2 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
        
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

          {isClient && (
            !isAuthenticated ? (
              <Link
                href="/auth/signin"
                className="p-6 mt-6 text-left border w-full md:w-96 rounded-xl hover:text-green-600 focus:text-green-600 hover:border-green-600 transition-colors"
              >
                <h3 className="text-2xl font-bold">Sign In &rarr;</h3>
                <p className="mt-4 text-xl">
                  Log in to your account to access your coaching dashboard
                </p>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="p-6 mt-6 text-left border w-full md:w-96 rounded-xl hover:text-green-600 focus:text-green-600 hover:border-green-600 transition-colors"
              >
                <h3 className="text-2xl font-bold">Dashboard &rarr;</h3>
                <p className="mt-4 text-xl">
                  Access your personal coaching dashboard
                </p>
              </Link>
            )
          )}
        </div>
      </main>
    </div>
  );
}