'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface JackierWorkbook {
  id: string;
  title: string;
  description: string;
  sections: WorkbookSection[];
}

export interface WorkbookSection {
  id: string;
  title: string;
  description?: string;
  questions: WorkbookQuestion[];
}

export interface WorkbookQuestion {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'rating' | 'checkbox' | 'choice' | 'scale' | 'info';
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export interface DiagnosisResult {
  summary: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  followupWorksheets: {
    pillars: string[];
    followup?: string;
  };
  createdAt: string;
}

export interface WorkbookSubmission {
  id: string;
  userId: string;
  workbookId: string;
  status: 'draft' | 'submitted';
  answers: Record<string, any>;
  diagnosis?: DiagnosisResult;
  followup?: {
    worksheetId: string;
    answers: Record<string, any>;
    submittedAt: string;
  };
  pillars?: Array<{
    worksheetId: string;
    answers: Record<string, any>;
    submittedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  diagnosisGeneratedAt?: string;
  diagnosisViewedAt?: string;
}

/**
 * Hook to fetch the Jackier Workbook and user's submission
 */
export function useJackierWorkbook() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch the Jackier Workbook
  const { 
    data: workbook,
    isLoading: isWorkbookLoading,
    error: workbookError 
  } = useQuery({
    queryKey: ['jackier', 'workbook'],
    queryFn: async () => {
      const response = await fetch('/api/jackier/workbook');
      if (!response.ok) {
        // Check if response is JSON or not
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error('Server returned a non-JSON response:', response.status, contentType, errorText.substring(0, 200));
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(`Failed to fetch workbook: ${response.status}`);
      }
      return response.json() as Promise<JackierWorkbook>;
    },
    enabled: !!session?.user,
  });

  // Fetch the user's submission
  const {
    data: userSubmission,
    isLoading: isSubmissionLoading,
    error: submissionError
  } = useQuery({
    queryKey: ['jackier', 'submission'],
    queryFn: async () => {
      const response = await fetch('/api/jackier/workbook/submission');
      if (!response.ok) {
        // Check if response is JSON or not
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error('Server returned a non-JSON response:', response.status, contentType, errorText.substring(0, 200));
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(`Failed to fetch submission: ${response.status}`);
      }
      
      // Parse the response
      const responseData = await response.json();
      
      // Check if submission exists using the new format
      if (!responseData.exists) {
        // No submission found, return null
        return null;
      }
      
      // Return the actual submission data
      return responseData.data as WorkbookSubmission;
    },
    enabled: !!session?.user,
  });

  /**
   * Save a draft of the workbook submission
   */
  const saveDraftMutation = useMutation({
    mutationFn: async (answers: Record<string, unknown>) => {
      const response = await fetch('/api/jackier/workbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'draft',
          answers,
        }),
      });
      
      if (!response.ok) {
        // Check if response is JSON or not
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error('Server returned a non-JSON response:', response.status, contentType, errorText.substring(0, 200));
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(`Failed to save draft: ${response.status}`);
      }
      
      return response.json() as Promise<WorkbookSubmission>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['jackier', 'submission'], data);
    },
    onError: (err) => {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    }
  });
  
  const saveDraft = async (answers: Record<string, unknown>) => {
    try {
      setError(null);
      await saveDraftMutation.mutateAsync(answers);
      return true;
    } catch (err) {
      return false;
    }
  };

  /**
   * Submit the workbook for diagnosis
   */
  const submitWorkbookMutation = useMutation({
    mutationFn: async (answers: Record<string, unknown>) => {
      const response = await fetch('/api/jackier/workbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'submitted',
          answers,
        }),
      });
      
      if (!response.ok) {
        // Check if response is JSON or not
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error('Server returned a non-JSON response:', response.status, contentType, errorText.substring(0, 200));
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(`Failed to submit workbook: ${response.status}`);
      }
      
      return response.json() as Promise<WorkbookSubmission>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['jackier', 'submission'], data);
    },
    onError: (err) => {
      console.error('Error submitting workbook:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit workbook');
    }
  });
  
  const submitWorkbook = async (answers: Record<string, unknown>) => {
    try {
      setError(null);
      return await submitWorkbookMutation.mutateAsync(answers);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Mark the diagnosis as viewed
   */
  const markDiagnosisViewedMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      // The server API endpoint is /api/diagnosis with POST method
      // Our proxy route is /api/jackier/diagnosis/view
      const response = await fetch(`/api/jackier/diagnosis/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
        }),
      });
      
      if (!response.ok) {
        // Check if response is JSON or not
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error('Server returned a non-JSON response:', response.status, contentType, errorText.substring(0, 200));
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(`Failed to mark diagnosis as viewed: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the cached submission data with the new diagnosisViewedAt timestamp
      queryClient.setQueryData<WorkbookSubmission | null>(
        ['jackier', 'submission'], 
        (oldData) => oldData ? {
          ...oldData,
          diagnosisViewedAt: data.diagnosisViewedAt,
        } : null
      );
    },
    onError: (err) => {
      console.error('Error marking diagnosis as viewed:', err);
    }
  });
  
  const markDiagnosisViewed = async () => {
    if (!userSubmission?.id) return;
    await markDiagnosisViewedMutation.mutateAsync(userSubmission.id);
  };

  // Combine errors from both queries
  const combinedError = workbookError || submissionError || error;
  
  return {
    workbook,
    userSubmission,
    isLoading: isWorkbookLoading || isSubmissionLoading,
    error: combinedError ? String(combinedError) : null,
    saveDraft,
    submitWorkbook,
    markDiagnosisViewed,
    isSaving: saveDraftMutation.isPending,
    isSubmitting: submitWorkbookMutation.isPending,
  };
}
