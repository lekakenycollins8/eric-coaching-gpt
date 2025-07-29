'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';
import type { FollowupCategoryType, FollowupWorksheet } from '@/types/followup';
import { useEffect } from 'react';

/**
 * Hook to fetch a follow-up worksheet by ID
 * @param followupId The follow-up worksheet ID
 * @param submissionId Optional ID of a previous submission to provide context
 * @returns Query result with the follow-up worksheet and optional previous submission
 */
export function useFollowupWorksheet(followupId: string | null, submissionId?: string | null) {
  const queryClient = useQueryClient();
  
  // Invalidate the query cache when submissionId changes
  useEffect(() => {
    if (followupId) {
      console.log(`Invalidating cache for worksheet: ${followupId} with submission: ${submissionId}`);
      // Invalidate all queries for this followupId to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['followupWorksheet', followupId]
      });
    }
  }, [followupId, submissionId, queryClient]);
  
  return useQuery({
    queryKey: ['followupWorksheet', followupId, submissionId],
    queryFn: async () => {
      if (!followupId) {
        throw new Error('Follow-up ID is required');
      }
      
      console.log(`Fetching worksheet: ${followupId} with submission: ${submissionId}`);
      try {
        const response = await followupApi.getFollowupWorksheet(followupId, submissionId || undefined);
        console.log('API response received:', response);
        
        // The API returns { success, worksheet, previousSubmission } structure
        if (!response.success || !response.worksheet) {
          console.error('Invalid API response structure:', response);
          throw new Error('Invalid response received from server');
        }
        
        const worksheet = response.worksheet;
        
        // Validate the worksheet data structure
        if (!worksheet || !worksheet.id || !worksheet.title) {
          console.error('Invalid worksheet data structure:', worksheet);
          throw new Error('Invalid worksheet data received from server');
        }
        
        // Return the original API response structure
        return response;
      } catch (error) {
        console.error('Error fetching worksheet data:', error);
        throw error;
      }
    },
    enabled: !!followupId,
    // Force refetch when submissionId changes
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: submissionId ? 0 : 5 * 60 * 1000, // Don't cache submission-specific data
  });
}

/**
 * Hook to fetch all available follow-up worksheets
 * @param type Optional type filter ('pillar' or 'workbook')
 * @returns Query result with all follow-up worksheets
 */
export function useFollowupWorksheets(type?: FollowupCategoryType) {
  return useQuery({
    queryKey: ['followupWorksheets', type],
    queryFn: () => followupApi.getAllFollowupWorksheets(type),
  });
}

/**
 * Hook to fetch a follow-up worksheet based on a previous submission
 * @param submissionId The original submission ID
 * @returns Query result with the follow-up worksheet
 */
export function useFollowupBySubmission(submissionId: string | null) {
  return useQuery({
    queryKey: ['followupBySubmission', submissionId],
    queryFn: () => followupApi.getFollowupBySubmission(submissionId!),
    enabled: !!submissionId,
  });
}

/**
 * Hook to determine the type of a follow-up worksheet
 * @param followupId The follow-up worksheet ID
 * @returns The follow-up type ('pillar' or 'workbook')
 */
export function useFollowupType(followupId: string | null): FollowupCategoryType | null {
  if (!followupId) return null;
  
  // First, check for exact patterns for pillar follow-ups
  // Format: pillarX-followup (e.g., pillar1-followup, pillar12-followup)
  if (/^pillar\d+-followup$/.test(followupId)) {
    return 'pillar';
  }
  
  // Check for exact patterns for workbook follow-ups
  // Format: jackier-stepX-followup (e.g., jackier-step1-followup)
  if (/^jackier-step\d+-followup$/.test(followupId)) {
    return 'workbook';
  }
  
  // Fallback checks for other naming patterns
  if (/^pillar\d+/.test(followupId) || followupId.includes('pillar')) {
    return 'pillar';
  }
  
  // Check for implementation or workbook keywords
  if (followupId.includes('implementation') || 
      followupId.includes('workbook') || 
      followupId.includes('jackier')) {
    return 'workbook';
  }
  
  // Default to workbook follow-up if we can't determine the type
  console.warn(`Could not determine follow-up type for ID: ${followupId}, defaulting to 'workbook'`);
  return 'workbook';
}

/**
 * Hook to extract pillar ID from a follow-up ID
 * @param followupId The follow-up worksheet ID
 * @returns The pillar ID or null if not a pillar follow-up
 */
export function usePillarId(followupId: string | null): string | null {
  if (!followupId || !followupId.includes('pillar')) return null;
  
  // Extract pillar ID from follow-up ID (e.g., "pillar1-followup" -> "pillar1")
  const match = followupId.match(/^(pillar\d+)/);
  return match ? match[1] : null;
}
