'use client';

import { useQuery } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';

// Define types for the workbook submission responses
type WorkbookSubmission = any; // Using 'any' for now, ideally should be properly typed

type LegacySubmissionResponse = {
  exists: boolean;
  message: string;
  data: WorkbookSubmission;
};

type MultiSubmissionResponse = {
  exists: boolean;
  message: string;
  submissions: WorkbookSubmission[];
};

// Union type to handle both response formats
type SubmissionResponse = LegacySubmissionResponse | MultiSubmissionResponse;

/**
 * Hook to fetch previous workbook submissions for the current user
 * @returns Query result with workbook submissions
 */
export function useWorkbookSubmissions() {
  return useQuery({
    queryKey: ['workbookSubmissions'],
    queryFn: async () => {
      const response = await followupApi.getWorkbookSubmissions() as SubmissionResponse;
      // Handle the updated API response format
      if ('data' in response && response.data) {
        // Handle legacy format (single submission)
        return { submissions: [response.data] };
      }
      return response as MultiSubmissionResponse;
    },
  });
}

/**
 * Hook to fetch previous worksheet submissions for the current user
 * @param pillarId Optional pillar ID to filter by
 * @returns Query result with worksheet submissions
 */
export function useWorksheetSubmissions(pillarId?: string) {
  return useQuery({
    queryKey: ['worksheetSubmissions', pillarId],
    queryFn: () => followupApi.getWorksheetSubmissions(pillarId),
  });
}
