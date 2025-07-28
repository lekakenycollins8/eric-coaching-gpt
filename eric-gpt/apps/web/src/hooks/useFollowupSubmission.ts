'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';
import { toast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import type { FollowupSubmissionData } from '@/types/followup';

/**
 * Hook for submitting follow-up assessments
 * @returns Mutation object for submitting follow-ups
 */
export function useFollowupSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FollowupSubmissionData) => followupApi.submitFollowup(data),
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['workbookSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['worksheetSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['followupRecommendations'] });
      queryClient.invalidateQueries({ queryKey: ['followupWorksheets'] });
      
      toast({
        title: 'Follow-up submitted',
        description: 'Your follow-up has been submitted successfully.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error submitting follow-up',
        description: error.message || 'An error occurred while submitting your follow-up.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for saving follow-up draft to localStorage
 * @param followupId The follow-up worksheet ID
 * @returns Functions for saving and loading drafts
 */
export function useFollowupDraft(followupId: string | null) {
  const [draftExists, setDraftExists] = useState(false);
  
  // Check if draft exists on mount
  useEffect(() => {
    if (followupId) {
      const draft = localStorage.getItem(`followup-draft-${followupId}`);
      setDraftExists(!!draft);
    }
  }, [followupId]);
  
  // Save draft to localStorage
  const saveDraft = (data: Partial<FollowupSubmissionData>) => {
    if (!followupId) return;
    
    localStorage.setItem(`followup-draft-${followupId}`, JSON.stringify(data));
    setDraftExists(true);
  };
  
  // Load draft from localStorage
  const loadDraft = (): Partial<FollowupSubmissionData> | null => {
    if (!followupId) return null;
    
    const draft = localStorage.getItem(`followup-draft-${followupId}`);
    return draft ? JSON.parse(draft) : null;
  };
  
  // Clear draft from localStorage
  /**
   * Clear draft from localStorage
   */
  const clearDraft = () => {
    if (!followupId) return;
    
    localStorage.removeItem(`followup-draft-${followupId}`);
    setDraftExists(false);
  };
  
  return {
    draftExists,
    saveDraft,
    loadDraft,
    clearDraft,
  };
}
