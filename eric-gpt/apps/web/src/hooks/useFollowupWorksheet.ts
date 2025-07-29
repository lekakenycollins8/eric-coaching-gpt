'use client';

import { useQuery } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';
import type { FollowupCategoryType, FollowupWorksheet } from '@/types/followup';

/**
 * Hook to fetch a follow-up worksheet by ID
 * @param followupId The follow-up worksheet ID
 * @param submissionId Optional ID of a previous submission to provide context
 * @returns Query result with the follow-up worksheet and optional previous submission
 */
export function useFollowupWorksheet(followupId: string | null, submissionId?: string | null) {
  return useQuery({
    queryKey: ['followupWorksheet', followupId, submissionId],
    queryFn: () => followupApi.getFollowupWorksheet(followupId!, submissionId || undefined),
    enabled: !!followupId,
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
  
  // Extract follow-up type from ID
  // Pillar follow-ups have IDs like "pillar1-followup"
  // Workbook follow-ups have IDs like "implementation-step1-followup"
  return followupId.includes('pillar') ? 'pillar' : 'workbook';
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
