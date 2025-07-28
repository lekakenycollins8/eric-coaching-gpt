'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FollowupWrapper } from '@/components/followup/FollowupWrapper';
import { useFollowupBySubmission } from '@/hooks/useFollowupWorksheet';
import { PageHeader } from '../../../../components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FollowupPageProps {
  params: {
    id: string;
  };
}

export default function FollowupPage({ params }: FollowupPageProps) {
  const { id } = params;
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submission');
  
  // If submission ID is provided, fetch the worksheet based on that
  const {
    data: worksheetBySubmission,
    isLoading: isLoadingBySubmission,
    error: submissionError,
    refetch
  } = useFollowupBySubmission(submissionId);
  
  // Refetch when submission ID changes
  useEffect(() => {
    if (submissionId) {
      refetch();
    }
  }, [submissionId, refetch]);
  
  // Handle loading state
  if (isLoadingBySubmission) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-12 w-3/4 max-w-md" />
        <Skeleton className="h-6 w-full max-w-2xl" />
        <div className="mt-8">
          <Skeleton className="h-64 w-full max-w-3xl mx-auto" />
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (submissionError) {
    return (
      <div className="container py-6">
        <PageHeader
          heading="Follow-up"
          description="Complete follow-up worksheets to track your progress"
        />
        <div className="mt-8 max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load follow-up worksheet. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  // If we have a submission ID but no worksheet found, show an error
  if (submissionId && !worksheetBySubmission) {
    return (
      <div className="container py-6">
        <PageHeader
          heading="Follow-up"
          description="Complete follow-up worksheets to track your progress"
        />
        <div className="mt-8 max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              No follow-up worksheet found for the selected submission.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <PageHeader
        heading="Follow-up"
        description="Complete follow-up worksheets to track your progress"
      />
      <div className="mt-8 max-w-3xl mx-auto">
        <FollowupWrapper followupId={id} />
      </div>
    </div>
  );
}
