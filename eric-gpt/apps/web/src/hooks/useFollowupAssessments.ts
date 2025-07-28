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
      // Use the recommendations endpoint as a proxy for assessments
      // since we don't need a separate endpoint just for this
      const { recommendations } = await followupApi.getRecommendations();
      return { assessments: recommendations };
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
      
      // Since we don't have a direct endpoint for fetching a single assessment,
      // we'll use the recommendations endpoint and filter by ID
      const { recommendations } = await followupApi.getRecommendations();
      const assessment = recommendations.find(r => r.followupId === assessmentId);
      
      if (!assessment) {
        throw new Error('Assessment not found');
      }
      
      return assessment as unknown as FollowupAssessment;
    },
    enabled: !!assessmentId
  });
}
