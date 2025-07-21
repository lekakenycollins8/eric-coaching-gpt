'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useWorksheet } from '@/hooks/useWorksheets';
import { useFollowupSubmission } from '@/hooks/useFollowupSubmission';
import { useSubscription } from '@/hooks/useSubscription';
import WorksheetForm from '@/components/worksheets/WorksheetForm';
import { FollowupSubmissionSuccess } from '@/components/worksheets/FollowupSubmissionSuccess';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QuotaExceededAlert } from '@/components/usage/QuotaExceededAlert';
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { hasFeatureAccess } from '@/lib/subscription-utils';

export default function FollowupWorksheetPage() {
  const params = useParams();
  const router = useRouter();
  const worksheetId = params.id as string;
  
  const { worksheet, isLoading, error } = useWorksheet(worksheetId);
  const { subscription, loading: subscriptionLoading, hasJustSubscribed } = useSubscription();
  const { 
    submitFollowup, 
    isSubmitting, 
    isSuccess,
    error: submissionError,
    submissionId,
    shouldPromptCoaching,
    worksheetTitle
  } = useFollowupSubmission();

  // Use URL parameters to check if user just completed a subscription
  const searchParams = useSearchParams();
  const urlHasSubscribedFlag = searchParams?.has('subscribed') || searchParams?.has('success') || false;
  const workbookSubmissionId = searchParams?.get('workbookId') || undefined;
  const worksheetType = searchParams?.get('type') || 'followup';
  
  // Check if user has access to worksheet submission feature
  const canSubmitWorksheet = hasFeatureAccess(
    subscription, 
    'worksheetSubmit', 
    { 
      isLoading: subscriptionLoading, 
      hasJustSubscribed: hasJustSubscribed || urlHasSubscribedFlag 
    }
  );
  
  // Show subscription alert if user doesn't have access to worksheet submission
  const showSubscriptionAlert = !subscriptionLoading && !canSubmitWorksheet && !urlHasSubscribedFlag;
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // Load draft or existing answers on initial render
  useEffect(() => {
    if (worksheetId) {
      // Try to load existing answers from localStorage
      try {
        const savedData = localStorage.getItem(`followup_draft_${worksheetId}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setFormData(parsed.answers || {});
        }
      } catch (error) {
        console.error('Error loading saved follow-up data:', error);
      }
    }
  }, [worksheetId]);

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const result = await submitFollowup({
        worksheetId,
        answers: data,
        workbookSubmissionId,
        type: worksheetType as 'pillar' | 'followup'
      });
      
      // Save the completed submission in localStorage for offline access
      if (result?.success) {
        localStorage.setItem(`followup_completed_${worksheetId}`, JSON.stringify({
          worksheetId,
          answers: data,
          completedAt: new Date().toISOString(),
          id: result.id
        }));
        
        // Remove the draft after successful submission
        localStorage.removeItem(`followup_draft_${worksheetId}`);
      }
    } catch (error) {
      console.error('Error submitting follow-up worksheet:', error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your follow-up worksheet.",
        variant: "destructive",
      });
    }
  };

  const handleSaveDraft = async (data: Record<string, any>) => {
    try {
      localStorage.setItem(`followup_draft_${worksheetId}`, JSON.stringify({
        worksheetId,
        answers: data,
        savedAt: new Date().toISOString()
      }));
      
      toast({
        title: "Draft Saved",
        description: "Your follow-up worksheet draft has been saved.",
      });
      
      return true;
    } catch (error) {
      console.error('Error saving follow-up draft:', error);
      return false;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Link href="/dashboard/worksheets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Worksheets
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state if either worksheet or subscription data is loading
  if (isLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Link href="/dashboard/worksheets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Worksheets
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">
            {isLoading ? "Loading follow-up worksheet..." : "Checking subscription status..."}
          </p>
        </div>
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            The requested follow-up worksheet could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show success state after submission
  if (isSuccess && submissionId) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href="/dashboard/worksheets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Worksheets
            </Button>
          </Link>
        </div>
        
        <FollowupSubmissionSuccess
          submissionId={submissionId}
          worksheetId={worksheetId}
          worksheetTitle={worksheetTitle || worksheet.title}
          shouldPromptCoaching={shouldPromptCoaching}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/dashboard/worksheets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Worksheets
          </Button>
        </Link>
      </div>

      {showSubscriptionAlert && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>You need an active subscription to submit this follow-up worksheet.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="default">
                <Link href="/dashboard/subscription">Subscribe Now</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/worksheets">Back to Worksheets</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {submissionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>
            {submissionError}
          </AlertDescription>
        </Alert>
      )}

      <WorksheetForm 
        worksheet={worksheet} 
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        initialData={formData}
        isSubmitting={isSubmitting}
        disabled={false}
        isFollowup={true}
      />
    </div>
  );
}
