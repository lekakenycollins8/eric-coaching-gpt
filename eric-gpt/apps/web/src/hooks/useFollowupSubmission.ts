'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from './useSubscription';
import { hasFeatureAccess } from '@/lib/subscription-utils';

interface FollowupSubmission {
  worksheetId: string;
  answers: Record<string, any>;
  workbookSubmissionId?: string;
  type?: 'pillar' | 'followup';
}

/**
 * Hook for follow-up worksheet submission and coaching integration
 */
export function useFollowupSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [shouldPromptCoaching, setShouldPromptCoaching] = useState(false);
  const [worksheetTitle, setWorksheetTitle] = useState<string>('');
  
  const { subscription, loading: subscriptionLoading, hasJustSubscribed } = useSubscription();
  const router = useRouter();
  const { toast } = useToast();

  /**
   * Submit a follow-up worksheet to the API
   */
  const submitFollowup = useCallback(async (submission: FollowupSubmission) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);
      setSubmissionId(null);
      setShouldPromptCoaching(false);
      
      // Check if user has access to the follow-up worksheet submission feature
      const hasAccess = hasFeatureAccess(subscription, 'worksheetSubmit', { 
        isLoading: subscriptionLoading, 
        hasJustSubscribed 
      });
      
      if (!hasAccess) {
        setError('An active subscription is required to submit follow-up worksheets.');
        return { success: false, error: 'subscription_required' };
      }
      
      console.log('Submitting follow-up worksheet:', submission.worksheetId);
      
      // Call the follow-up API
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId: submission.worksheetId,
          answers: submission.answers,
          workbookSubmissionId: submission.workbookSubmissionId,
          type: submission.type || 'followup'
        }),
      });
      
      if (!response.ok) {
        // Handle error response
        const errorText = await response.text();
        let errorMessage = 'Failed to submit follow-up worksheet';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw error text
          errorMessage = errorText || errorMessage;
        }
        
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse the success response
      const data = await response.json();
      
      // Store the submission ID and coaching prompt flag
      setSubmissionId(data.id);
      setShouldPromptCoaching(data.shouldPromptCoaching || false);
      setWorksheetTitle(data.worksheetTitle || 'Follow-up');
      
      // Show success toast
      toast({
        title: "Follow-up Worksheet Submitted",
        description: "Your follow-up worksheet has been submitted successfully.",
      });
      
      setIsSuccess(true);
      return { 
        success: true, 
        id: data.id, 
        shouldPromptCoaching: data.shouldPromptCoaching || false,
        worksheetTitle: data.worksheetTitle || 'Follow-up'
      };
    } catch (err) {
      console.error('Error submitting follow-up worksheet:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit follow-up worksheet');
      
      // Show error toast
      toast({
        title: "Submission Error",
        description: err instanceof Error ? err.message : 'Failed to submit follow-up worksheet',
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [subscription, subscriptionLoading, hasJustSubscribed, toast]);

  return {
    submitFollowup,
    isSubmitting,
    isSuccess,
    error,
    submissionId,
    shouldPromptCoaching,
    worksheetTitle,
    hasActiveSubscription: hasFeatureAccess(subscription, 'worksheetSubmit', { 
      isLoading: subscriptionLoading, 
      hasJustSubscribed 
    }),
    subscriptionLoading,
    hasJustSubscribed,
  };
}
