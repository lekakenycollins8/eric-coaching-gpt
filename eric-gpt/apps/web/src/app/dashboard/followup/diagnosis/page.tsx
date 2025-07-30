'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, CheckCircle2, LineChart } from 'lucide-react';
import { followupApi } from '@/lib/api/followupApi';
import { formatDistanceToNow } from 'date-fns';

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
      try {
        const result = await followupApi.getRecentFollowupSubmission();
        console.log('Recent submission data:', result);
        return result;
      } catch (err) {
        console.error('Error fetching recent submission:', err);
        throw err;
      }
    },
    retry: 1,
  });

  // State to track if we should show the summary or redirect immediately
  const [showSummary, setShowSummary] = useState(true);
  
  // Handle navigation to the full diagnosis page
  const navigateToFullDiagnosis = () => {
    if (data?.submission) {
      const { followupType, followupId } = data.submission;
      
      console.log(`Navigating to ${followupType} diagnosis for ${followupId}`);
      
      if (followupType === 'workbook') {
        router.push('/dashboard/followup/workbook/diagnosis');
      } else if (followupId) {
        router.push(`/dashboard/followup/${followupId}/diagnosis`);
      }
    }
  };
  
  // Auto-redirect after a delay if user doesn't interact
  useEffect(() => {
    if (data?.submission && showSummary) {
      // If there's no diagnosis summary, redirect immediately
      if (!data.submission.diagnosisSummary) {
        navigateToFullDiagnosis();
        return;
      }
      
      // Otherwise, set a timeout to redirect after 5 seconds
      const timer = setTimeout(() => {
        navigateToFullDiagnosis();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [data, showSummary]);

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

  // Show diagnosis summary if available
  if (data?.submission?.diagnosisSummary) {
    const { submission } = data;
    const completedDate = submission.completedAt ? new Date(submission.completedAt) : new Date();
    const timeAgo = formatDistanceToNow(completedDate, { addSuffix: true });
    const followupTypeLabel = submission.followupType === 'pillar' ? 'Pillar' : 'Workbook';
    
    return (
      <div className="container py-6 space-y-6">
        <PageHeader
          heading={`Your ${followupTypeLabel} Follow-up Diagnosis`}
          description="Here's a summary of your latest follow-up diagnosis"
        />
        
        <Card className="border-green-100 bg-green-50 max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle>{`${followupTypeLabel} Follow-up Diagnosis`}</CardTitle>
            </div>
            <CardDescription>
              Completed {timeAgo}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-md border">
              <p className="whitespace-pre-wrap">{submission.diagnosisSummary?.summary || 'No summary available'}</p>
            </div>
            
            {submission.diagnosisSummary?.hasDetailedDiagnosis && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LineChart className="h-4 w-4" />
                <span>Detailed analysis and recommendations available in the full report</span>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={navigateToFullDiagnosis} 
              className="w-full flex items-center justify-center gap-2"
            >
              View Full Diagnosis <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
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
