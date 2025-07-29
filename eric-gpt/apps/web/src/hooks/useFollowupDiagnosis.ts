import { useQuery } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';
import { useFollowupType } from './useFollowupType';

/**
 * Interface for follow-up diagnosis data
 */
export interface FollowupDiagnosis {
  title: string;
  diagnosis: string;
  recommendations: string[];
  completedAt?: string;
  progressData?: Record<string, string | number>;
  followupType?: 'pillar' | 'workbook';
}

/**
 * Hook to fetch follow-up diagnosis data
 * @param followupId The ID of the follow-up to fetch diagnosis for, or 'workbook' for workbook follow-ups
 * @returns Query result with diagnosis data
 */
export function useFollowupDiagnosis(followupId: string) {
  // Determine the follow-up type based on the ID
  const followupType = useFollowupType(followupId);
  
  return useQuery<FollowupDiagnosis, Error>({
    queryKey: ['followupDiagnosis', followupId, followupType],
    queryFn: async () => {
      if (!followupId) {
        throw new Error('Follow-up ID is required');
      }
      
      console.log(`Fetching diagnosis for ${followupType} follow-up: ${followupId}`);
      
      try {
        if (followupId === 'workbook') {
          return await followupApi.getWorkbookFollowupDiagnosis();
        } else {
          return await followupApi.getFollowupDiagnosis(followupId);
        }
      } catch (error) {
        console.error(`Error fetching ${followupType} diagnosis:`, error);
        throw error;
      }
    },
    enabled: !!followupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry failed requests twice
  });
}
