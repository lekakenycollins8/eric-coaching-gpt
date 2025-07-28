'use client';

import { useQuery } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';

/**
 * Hook to fetch previous workbook submissions for the current user
 * @returns Query result with workbook submissions
 */
export function useWorkbookSubmissions() {
  return useQuery({
    queryKey: ['workbookSubmissions'],
    queryFn: () => followupApi.getWorkbookSubmissions(),
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
