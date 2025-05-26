'use client';

import { useState, useCallback } from 'react';
import type { WorksheetSubmission } from '@/types/worksheet';

/**
 * Hook for worksheet submission, AI feedback, and draft saving
 */
export function useWorksheetSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

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
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error('You have reached your monthly submission limit. Please upgrade your plan for more submissions.');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit worksheet');
      }
      
      const data = await response.json();
      
      // Store the AI feedback and submission ID
      setFeedback(data.aiFeedback);
      setSubmissionId(data.id);
      setRemainingQuota(data.remainingQuota);
      
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
  };
}
