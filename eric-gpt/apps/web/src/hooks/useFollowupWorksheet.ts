import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'choice' | 'checkbox' | 'rating' | 'scale' | 'info';
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

interface FollowupWorksheet {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface FollowupSubmission {
  id: string;
  worksheetId: string;
  userId: string;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function useFollowupWorksheet(worksheetId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  // Fetch the follow-up worksheet
  const {
    data: worksheet,
    isLoading: isWorksheetLoading,
    error: worksheetError
  } = useQuery({
    queryKey: ['followupWorksheet', worksheetId],
    queryFn: async () => {
      if (!session?.user) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/jackier/followup/${worksheetId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          throw new Error('Subscription required');
        } else if (response.status === 404) {
          throw new Error('Worksheet not found');
        } else {
          throw new Error('Failed to fetch worksheet');
        }
      }
      
      return response.json() as Promise<FollowupWorksheet>;
    },
    enabled: !!session?.user && !!worksheetId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch existing submission for this worksheet
  const {
    data: submission,
    isLoading: isSubmissionLoading,
    error: submissionError
  } = useQuery({
    queryKey: ['followupSubmission', worksheetId],
    queryFn: async () => {
      if (!session?.user) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/jackier/followup/${worksheetId}/submission`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No submission yet, not an error
          return null;
        } else if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          throw new Error('Subscription required');
        } else {
          throw new Error('Failed to fetch submission');
        }
      }
      
      return response.json() as Promise<FollowupSubmission>;
    },
    enabled: !!session?.user && !!worksheetId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (answers: Record<string, unknown>) => {
      if (!session?.user) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/jackier/followup/${worksheetId}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          throw new Error('Subscription required');
        } else {
          throw new Error('Failed to save draft');
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the submission cache with the new draft data
      queryClient.setQueryData(['followupSubmission', worksheetId], (oldData: any) => {
        if (!oldData) {
          return {
            worksheetId,
            answers: data.answers,
            updatedAt: new Date().toISOString(),
          };
        }
        
        return {
          ...oldData,
          answers: data.answers,
          updatedAt: new Date().toISOString(),
        };
      });
    },
  });
  
  // Submit worksheet mutation
  const submitMutation = useMutation({
    mutationFn: async (answers: Record<string, unknown>) => {
      if (!session?.user) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/jackier/followup/${worksheetId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          throw new Error('Subscription required');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to submit worksheet');
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the submission cache with the submitted data
      queryClient.setQueryData(['followupSubmission', worksheetId], data);
      
      // Invalidate the jackier workbook submission query to refresh the main page
      queryClient.invalidateQueries({ queryKey: ['jackierSubmission'] });
    },
  });
  
  // Save draft function
  const saveDraft = async (answers: Record<string, any>) => {
    try {
      await saveDraftMutation.mutateAsync(answers);
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  };
  
  // Submit worksheet function
  const submitFollowupWorksheet = async (answers: Record<string, any>) => {
    return submitMutation.mutateAsync(answers);
  };
  
  // Combine loading states
  const isLoading = isWorksheetLoading || isSubmissionLoading;
  
  // Combine error states
  const error = worksheetError 
    ? (worksheetError as Error).message 
    : submissionError 
      ? (submissionError as Error).message 
      : null;
  
  return {
    worksheet,
    existingAnswers: submission?.answers || {},
    isLoading,
    error,
    saveDraft,
    submitFollowupWorksheet,
    isSaving: saveDraftMutation.isPending,
    isSubmitting: submitMutation.isPending,
  };
}
