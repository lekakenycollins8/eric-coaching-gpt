'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

export interface WorkbookStatus {
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  lastUpdated: string | null;
  submissionId: string | null;
}

/**
 * Hook to fetch the user's workbook completion status
 */
export function useWorkbookStatus() {
  const { data: session } = useSession();

  // Fetch the workbook status
  const { 
    data: status,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['jackier', 'workbook', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/jackier/workbook/status');
      
      if (!response.ok) {
        // Check if response is JSON or not
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error('Server returned a non-JSON response:', response.status, contentType, errorText.substring(0, 200));
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(`Failed to fetch workbook status: ${response.status}`);
      }
      
      return response.json() as Promise<WorkbookStatus>;
    },
    enabled: !!session?.user,
    // Refresh every 5 minutes if the window is focused
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
  });

  return {
    status,
    isLoading,
    error: error ? String(error) : null,
    refetch,
  };
}
