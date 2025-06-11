'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrackerDetails from '@/components/trackers/TrackerDetails';

export default function TrackerDetailsPage() {
  const { id } = useParams();
  const trackerId = Array.isArray(id) ? id[0] : (id || '');
  
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin?callbackUrl=/dashboard/trackers');
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
      
      <TrackerDetails trackerId={trackerId} />
    </div>
  );
}
