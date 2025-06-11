'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTrackerForm from '@/components/trackers/CreateTrackerForm';

export default function CreateTrackerPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin?callbackUrl=/dashboard/trackers/create');
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
    <div>
      <div className="mb-6">
        <Link href="/dashboard/trackers">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Trackers
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress over 5 days and reflect on your journey
        </p>
      </div>
      
      <CreateTrackerForm />
    </div>
  );
}
