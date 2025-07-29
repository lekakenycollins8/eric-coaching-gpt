import { useMemo } from 'react';

/**
 * Hook to determine the type of follow-up (pillar or workbook) based on the ID
 * @param followupId The ID of the follow-up
 * @returns The type of follow-up ('pillar' or 'workbook')
 */
export function useFollowupType(followupId?: string): 'pillar' | 'workbook' {
  return useMemo(() => {
    if (!followupId) return 'workbook';
    
    // Check if the ID contains 'pillar' or matches the pillar ID pattern
    if (
      followupId.includes('pillar') || 
      /^(pillar-\d+|p\d+|[a-z]+-pillar)/.test(followupId)
    ) {
      return 'pillar';
    }
    
    return 'workbook';
  }, [followupId]);
}
