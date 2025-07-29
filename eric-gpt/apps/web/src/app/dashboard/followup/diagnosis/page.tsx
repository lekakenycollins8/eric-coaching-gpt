'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { followupApi } from '@/lib/api/followupApi';

/**
 * Smart diagnosis landing page that redirects to the appropriate diagnosis page
 * based on the user's most recent follow-up submission
 */
export default function DiagnosisLandingPage() {
  const router = useRouter();
  
  // Fetch the most recent follow-up submission
  const { data, isLoading, error } = useQuery({
    queryKey: ['recentFollowupSubmission'],
    queryFn: async () => {
      return await followupApi.getRecentFollowupSubmission();
    },
  });

  // Redirect based on the submission type
  useEffect(() => {
    if (data?.submission) {
      const { followupType, followupId } = data.submission;
      
      console.log(`Redirecting to ${followupType} diagnosis for ${followupId}`);
      
      if (followupType === 'workbook') {
        router.push('/dashboard/followup/workbook/diagnosis');
      } else if (followupId) {
        router.push(`/dashboard/followup/${followupId}/diagnosis`);
      }
    }
  }, [data, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <PageHeader
          heading="Loading Your Diagnosis"
          description="Please wait while we retrieve your follow-up diagnosis..."
        />
        <Card>
          <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Retrieving your diagnosis data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container py-6 space-y-6">
        <PageHeader
          heading="Diagnosis Not Available"
          description="We encountered an issue retrieving your diagnosis."
        />
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4">We couldn't find a recent follow-up submission to display a diagnosis for.</p>
            <div className="flex gap-4 mt-6">
              <Button onClick={() => router.push('/dashboard/followup')}>
                Go to Follow-ups
              </Button>
              <Button variant="outline" onClick={() => router.refresh()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default loading view (should be replaced by the redirect)
  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        heading="Preparing Your Diagnosis"
        description="Please wait while we prepare your follow-up diagnosis..."
      />
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    </div>
  );
}
