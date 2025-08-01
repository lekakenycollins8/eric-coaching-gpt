/**
 * React Query hooks for follow-up assessments
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { followupApi } from '../lib/api/followupApi';
import type { FollowupAssessment, FollowupSubmissionData } from '../types/followup';

/**
 * Hook to fetch follow-up assessments for the current user
 * @param userId Optional user ID to filter by
 * @returns Query result with follow-up assessments
 */
export function useFollowupAssessments(userId?: string) {
  return useQuery({
    queryKey: ['followup-assessments', userId],
    queryFn: async () => {
      // Use the recent submission endpoint as a proxy for assessments
      // since the recommendations feature was removed
      const { submission } = await followupApi.getRecentFollowupSubmission();
      return { assessments: submission ? [submission] : [] };
    }
  });
}

/**
 * Hook to submit a follow-up assessment
 * @returns Mutation function and state for submitting a follow-up
 */
export function useSubmitFollowup() {
  return useMutation({
    mutationFn: (data: FollowupSubmissionData) => {
      return followupApi.submitFollowup(data);
    }
  });
}

/**
 * Hook to fetch a specific follow-up assessment by ID
 * @param assessmentId The assessment ID to fetch
 * @returns Query result with the follow-up assessment
 */
export function useFollowupAssessment(assessmentId: string | null) {
  return useQuery({
    queryKey: ['followup-assessment', assessmentId],
    queryFn: async () => {
      if (!assessmentId) {
        throw new Error('Assessment ID is required');
      }
      
      // Since the recommendations feature was removed, we'll use the diagnosis endpoint directly
      // which provides assessment data for a specific followup ID
      const diagnosisData = await followupApi.getFollowupDiagnosis(assessmentId);
      
      if (!diagnosisData) {
        throw new Error('Assessment not found');
      }
      
      return diagnosisData as unknown as FollowupAssessment;
    },
    enabled: !!assessmentId
  });
}
