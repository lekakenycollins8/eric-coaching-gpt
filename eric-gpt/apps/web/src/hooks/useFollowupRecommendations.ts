'use client';

import { useQuery } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';
import type { FollowupRecommendation } from '@/types/followup';

/**
 * Hook to fetch follow-up recommendations for the current user
 * @returns Query result with follow-up recommendations
 */
export function useFollowupRecommendations() {
  return useQuery({
    queryKey: ['followupRecommendations'],
    queryFn: () => followupApi.getRecommendations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to filter recommendations by type
 * @param recommendations List of recommendations
 * @param type Type to filter by ('pillar' or 'workbook')
 * @returns Filtered recommendations
 */
export function useFilteredRecommendations(
  recommendations: FollowupRecommendation[] | undefined,
  type: 'pillar' | 'workbook'
) {
  if (!recommendations) return [];
  
  return recommendations.filter(rec => 
    type === 'pillar' ? 
      rec.followupId.includes('pillar') : 
      !rec.followupId.includes('pillar')
  );
}
