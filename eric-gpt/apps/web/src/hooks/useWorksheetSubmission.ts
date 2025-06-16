'use client';

import { useState, useCallback } from 'react';
import type { WorksheetSubmission } from '@/types/worksheet';
import { useSubscription } from './useSubscription';
import { hasFeatureAccess } from '@/lib/subscription-utils';

/**
 * Hook for worksheet submission, AI feedback, and draft saving
 */
export function useWorksheetSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [quotaLimit, setQuotaLimit] = useState<number | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { subscription, loading: subscriptionLoading, hasJustSubscribed, fetchSubscription } = useSubscription();

  /**
   * Submit a worksheet to the API and get AI coaching feedback
   */
  const submitWorksheet = useCallback(async (submission: WorksheetSubmission) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setFeedback(null);
      setIsSuccess(false);
      setSubmissionId(null);
      
      // If subscription data is still loading, wait for it
      if (subscriptionLoading) {
        await new Promise(resolve => setTimeout(resolve, 500));
        // Try to refresh subscription data before proceeding
        await fetchSubscription();
      }
      
      // Check if user has access to the worksheet submission feature
      // Pass loading and hasJustSubscribed flags to the access check
      if (!hasFeatureAccess(subscription, 'worksheetSubmit', { isLoading: subscriptionLoading, hasJustSubscribed })) {
        setError('An active subscription is required to submit worksheets. Please subscribe to continue.');
        return { success: false, error: 'subscription_required' };
      }
      
      console.log('Submitting worksheet for AI feedback:', submission.worksheetId);
      
      // Call the submissions API
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetId: submission.worksheetId,
          answers: submission.answers,
        }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()].map(([k, v]) => `${k}: ${v}`).join(', '));
      
      // Clone the response so we can try multiple ways to read it if needed
      const responseClone = response.clone();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error('You have reached your monthly submission limit. Please upgrade your plan for more submissions.');
        }
        
        if (response.status === 503) {
          throw new Error('Unable to connect to the server. Please try again later.');
        }
        
        // Try to get a useful error message from the response
        let errorMessage = 'Failed to submit worksheet';
        
        try {
          const errorText = await responseClone.text();
          console.log('Error response text:', errorText);
          
          try {
            // Try to parse as JSON
            if (errorText && errorText.trim()) {
              const errorData = JSON.parse(errorText);
              if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.error) {
                errorMessage = errorData.error;
              }
            }
          } catch (jsonError) {
            console.error('Error response is not valid JSON:', jsonError);
            // Use the raw text if it's not empty
            if (errorText && errorText.trim()) {
              errorMessage = 'Server error: ' + errorText.substring(0, 100); // Limit length
            }
          }
        } catch (textError) {
          console.error('Could not read error response text:', textError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Try to parse the success response
      let data;
      try {
        // Use the cloned response we created earlier
        const responseText = await response.text();
        console.log('Success response text:', responseText);
        
        try {
          // Ensure we have a valid JSON response
          if (responseText && responseText.trim()) {
            data = JSON.parse(responseText);
            console.log('Parsed success data:', data);
          } else {
            console.error('Empty success response received');
            throw new Error('The server returned an empty response');
          }
        } catch (jsonError) {
          console.error('Error parsing JSON success response:', jsonError);
          throw new Error('Failed to parse server response');
        }
      } catch (textError) {
        console.error('Error reading success response:', textError);
        throw new Error('Failed to read server response');
      }
      
      // Store the AI feedback and submission ID
      setFeedback(data.aiFeedback);
      setSubmissionId(data.id);
      setRemainingQuota(data.remainingQuota);
      
      // Refresh subscription data after successful submission
      fetchSubscription();
      
      // Remove the draft after successful submission
      localStorage.removeItem(`worksheet_draft_${submission.worksheetId}`);
      
      // Save the completed submission with feedback in localStorage for offline access
      const key = `worksheet_completed_${submission.worksheetId}`;
      localStorage.setItem(key, JSON.stringify({
        ...submission,
        id: data.id,
        aiFeedback: data.aiFeedback,
        completedAt: new Date().toISOString()
      }));
      
      setIsSuccess(true);
      return { success: true, id: data.id, feedback: data.aiFeedback };
    } catch (err) {
      console.error('Error submitting worksheet:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit worksheet');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  /**
   * Save a draft of the worksheet to localStorage
   */
  const saveDraft = useCallback(async (worksheetId: string, answers: Record<string, any>) => {
    try {
      const draft = { worksheetId, answers };
      localStorage.setItem(`worksheet_draft_${worksheetId}`, JSON.stringify(draft));
      return true;
    } catch (err) {
      console.error('Error saving draft:', err);
      return false;
    }
  }, []);

  /**
   * Load a draft of the worksheet from localStorage
   */
  const loadDraft = useCallback((worksheetId: string) => {
    try {
      const draftJson = localStorage.getItem(`worksheet_draft_${worksheetId}`);
      if (!draftJson) return null;
      
      return JSON.parse(draftJson) as { worksheetId: string; answers: Record<string, any> };
    } catch (err) {
      console.error('Error loading draft:', err);
      return null;
    }
  }, []);

  /**
   * Get the user's remaining submission quota
   */
  const fetchRemainingQuota = useCallback(async () => {
    try {
      const response = await fetch('/api/submissions?limit=1');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quota information');
      }
      
      const data = await response.json();
      setRemainingQuota(data.remainingQuota);
      setQuotaLimit(data.quotaLimit);
      return data.remainingQuota;
    } catch (err) {
      console.error('Error fetching quota:', err);
      return null;
    }
  }, []);

  return {
    submitWorksheet,
    saveDraft,
    loadDraft,
    fetchRemainingQuota,
    isSubmitting,
    isSuccess,
    feedback,
    submissionId,
    remainingQuota,
    error,
    isOverQuota: remainingQuota !== null && remainingQuota <= 0,
    quotaLimit,
    quotaUsed: quotaLimit !== null && remainingQuota !== null ? quotaLimit - remainingQuota : null,
    hasActiveSubscription: hasFeatureAccess(subscription, 'worksheetSubmit', { isLoading: subscriptionLoading, hasJustSubscribed }),
    subscriptionLoading,
    hasJustSubscribed,
  };
}
