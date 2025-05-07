'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AuthenticatedContent() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  
  // Only render after first mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render anything until component has mounted
  if (!mounted) return null;
  
  const isAuthenticated = status === 'authenticated';
  
  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/signin"
        className="p-6 mt-6 text-left border w-full md:w-96 rounded-xl hover:text-green-600 focus:text-green-600 hover:border-green-600 transition-colors"
      >
        <h3 className="text-2xl font-bold">Sign In &rarr;</h3>
        <p className="mt-4 text-xl">
          Log in to your account to access your coaching dashboard
        </p>
      </Link>
    );
  }
  
  return (
    <>
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
        <p className="text-green-800 font-medium">Welcome back, {session?.user?.email}!</p>
        <Link 
          href="/dashboard"
          className="mt-2 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
      
      <Link
        href="/dashboard"
        className="p-6 mt-6 text-left border w-full md:w-96 rounded-xl hover:text-green-600 focus:text-green-600 hover:border-green-600 transition-colors"
      >
        <h3 className="text-2xl font-bold">Dashboard &rarr;</h3>
        <p className="mt-4 text-xl">
          Access your personal coaching dashboard
        </p>
      </Link>
    </>
  );
}
