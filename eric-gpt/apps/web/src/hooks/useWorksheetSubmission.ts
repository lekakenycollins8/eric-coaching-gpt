'use client';

import { useState, useCallback } from 'react';
import type { WorksheetSubmission } from '@/types/worksheet';

/**
 * Hook for worksheet form state management and draft saving
 * Note: Actual API submission will be implemented in Sprint 3
 */
export function useWorksheetSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for submission functionality (to be implemented in Sprint 3)
  const submitWorksheet = useCallback(async (submission: WorksheetSubmission) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);
      
      // In Sprint 2, we'll just simulate a submission
      console.log('Worksheet submission (placeholder):', submission);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save as a completed submission in localStorage for now
      const key = `worksheet_completed_${submission.worksheetId}`;
      localStorage.setItem(key, JSON.stringify({
        ...submission,
        completedAt: new Date().toISOString()
      }));
      
      // Remove the draft after successful submission
      localStorage.removeItem(`worksheet_draft_${submission.worksheetId}`);
      
      setIsSuccess(true);
      return { success: true };
    } catch (err) {
      console.error('Error submitting worksheet:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit worksheet');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

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

  // For Sprint 2, we'll return a placeholder feedback value
  // In Sprint 3, this will be replaced with actual AI feedback
  const placeholderFeedback = isSuccess ? "Thank you for submitting your worksheet! In Sprint 3, you'll receive AI-powered coaching feedback here." : null;
  const placeholderSubmissionId = isSuccess ? `temp-${Date.now()}` : null;
  
  return {
    submitWorksheet,
    saveDraft,
    loadDraft,
    isSubmitting,
    isSuccess,
    feedback: placeholderFeedback,
    submissionId: placeholderSubmissionId,
    error,
  };
}
