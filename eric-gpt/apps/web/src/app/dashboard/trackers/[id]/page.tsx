'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrackerDetails from '@/components/trackers/TrackerDetails';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TrackerDetailsPage() {
  const { id } = useParams();
  const trackerId = Array.isArray(id) ? id[0] : (id || '');
  
  const { subscription } = useSubscription();
  
  // Check if user has an active subscription
  // Consider subscription as not active if it's null (still loading) or not 'active'
  const hasActiveSubscription = subscription?.status === 'active';
  const showSubscriptionAlert = subscription === null || !hasActiveSubscription;
  
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
      
      {showSubscriptionAlert && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>You need an active subscription to update tracker entries and reflections.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="default">
                <Link href="/dashboard/subscription">Subscribe Now</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/trackers">Back to Trackers</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <TrackerDetails trackerId={trackerId} />
    </div>
  );
}
