import { useQuery } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';
import { useFollowupType } from './useFollowupType';

/**
 * Interface for pillar diagnosis structure
 */
export interface PillarDiagnosis {
  summary?: string;
  situationAnalysis?: {
    fullText: string;
  };
  strengths?: string[];
  challenges?: string[];
  actionableRecommendations?: string[];
}

/**
 * Interface for structured recommendation objects
 */
export interface RecommendationObject {
  action?: string;
  implementation?: string;
  outcome?: string;
  measurement?: string;
}

/**
 * Interface for follow-up diagnosis data
 */
export interface FollowupDiagnosis {
  title: string;
  diagnosis: string | PillarDiagnosis;
  recommendations: (string | RecommendationObject)[];
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
      
      // Special case handling for direct access to diagnosis URLs
      if (followupId === 'diagnosis') {
        try {
          // Try to fetch the most recent follow-up submission to determine the correct diagnosis type
          const recentData = await followupApi.getRecentFollowupSubmission();
          
          if (recentData.submission) {
            const submissionType = recentData.submission.followupType;
            const submissionId = recentData.submission.followupId;
            
            console.log(`Found recent ${submissionType} follow-up submission: ${submissionId}`);
            
            // Redirect to the appropriate diagnosis based on the submission type
            if (submissionType === 'workbook') {
              return await followupApi.getWorkbookFollowupDiagnosis();
            } else if (submissionId) {
              // For pillar follow-ups, use the specific follow-up ID
              return await followupApi.getFollowupDiagnosis(submissionId);
            }
          }
          
          // Fallback to workbook diagnosis if we can't determine the type
          console.log('No recent submission found, defaulting to workbook diagnosis');
          return await followupApi.getWorkbookFollowupDiagnosis();
        } catch (error) {
          console.error('Error fetching recent submission:', error);
          // Fallback to workbook diagnosis on error
          return await followupApi.getWorkbookFollowupDiagnosis();
        }
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
