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

export interface StrengthAnalysis {
  strength: string;
  evidence: string;
  impact: string;
  leverage: string;
}

export interface GrowthAreaAnalysis {
  area: string;
  evidence: string;
  impact: string;
  rootCause: string;
}

export interface ActionableRecommendation {
  action: string;
  implementation: string;
  outcome: string;
  measurement: string;
}

export interface PillarRecommendation {
  id: string;
  title: string;
  reason: string;
  impact: string;
  exercise: string;
  relevanceScore: number;
}

export interface FollowupRecommendation {
  id: string;
  title: string;
  reason: string;
  connection: string;
  focus: string;
}

export interface DiagnosisResult {
  // Basic fields for backward compatibility
  summary: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  followupWorksheets: {
    pillars: string[];
    followup?: string;
  };
  createdAt: string;
  
  // Enhanced fields for more detailed analysis
  situationAnalysis?: {
    context?: string;
    challenges?: string;
    patterns?: string;
    impact?: string;
    fullText: string;
  };
  strengthsAnalysis?: StrengthAnalysis[];
  growthAreasAnalysis?: GrowthAreaAnalysis[];
  actionableRecommendations?: ActionableRecommendation[];
  pillarRecommendations?: PillarRecommendation[];
  followupRecommendation?: FollowupRecommendation;
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
    error: workbookError,
    isSuccess: isWorkbookSuccess
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
      const data = await response.json();
      // Extract the workbook from the response, which comes as { workbook: {...} }
      return data.workbook as JackierWorkbook;
    },
    enabled: !!session?.user,
  });

  // Fetch the user's submission
  const {
    data: userSubmission,
    isLoading: isSubmissionLoading,
    error: submissionError,
    isSuccess: isSubmissionSuccess
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
      
      console.log('Jackier workbook submission API response:', responseData);
      
      // Check if submission exists
      if (!responseData.exists) {
        console.log('No submission found in API response');
        // No submission found, return null
        return null;
      }
      
      // Handle the case where the API returns an array of submissions
      if (responseData.submissions && Array.isArray(responseData.submissions) && responseData.submissions.length > 0) {
        // Find the most recent submitted submission with a diagnosis
        const submittedWithDiagnosis = responseData.submissions
          .filter((sub: any) => sub.status === 'submitted' && sub.diagnosis)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        if (submittedWithDiagnosis.length > 0) {
          const latestSubmission = submittedWithDiagnosis[0];
          console.log('Using latest submission with diagnosis:', latestSubmission._id);
          
          // Log the diagnosis data
          if (latestSubmission.diagnosis) {
            console.log('Diagnosis found in submission:', latestSubmission.diagnosis);
          }
          
          // Convert _id to id if needed
          return {
            ...latestSubmission,
            id: latestSubmission._id || latestSubmission.id
          } as WorkbookSubmission;
        } else {
          // If no submissions with diagnosis, use the latest submitted one
          const latestSubmitted = responseData.submissions
            .filter((sub: any) => sub.status === 'submitted')
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            
          if (latestSubmitted.length > 0) {
            console.log('Using latest submitted submission (no diagnosis):', latestSubmitted[0]._id);
            return {
              ...latestSubmitted[0],
              id: latestSubmitted[0]._id || latestSubmitted[0].id
            } as WorkbookSubmission;
          }
        }
        
        console.log('No suitable submission found in the array');
        return null;
      }
      
      // Handle the case where a single data object is returned (old format)
      if (responseData.data) {
        // Log the diagnosis data specifically
        if (responseData.data.diagnosis) {
          console.log('Diagnosis found in submission:', responseData.data.diagnosis);
        } else {
          console.log('No diagnosis found in submission data');
        }
        
        // Return the actual submission data
        return responseData.data as WorkbookSubmission;
      }
      
      console.log('Unexpected API response format');
      return null;
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
          workbookId: 'jackier-method-workbook', // Add the required workbookId field
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
          workbookId: 'jackier-method-workbook', // Add the required workbookId field
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
      const result = await submitWorkbookMutation.mutateAsync(answers);
      
      // Force invalidation and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['jackier', 'submission'] });
      await queryClient.refetchQueries({ queryKey: ['jackier', 'submission'] });
      
      return result;
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
      try {
        const response = await fetch(`/api/jackier/diagnosis/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            submissionId,
          }),
        });
        
        // Handle authentication errors (401) specially to prevent infinite loops
        if (response.status === 401) {
          console.warn('Authentication required to mark diagnosis as viewed');
          // Return a fake success response to prevent retries
          return { success: false, reason: 'auth_required' };
        }
        
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
      } catch (error) {
        console.error('Error in markDiagnosisViewed API call:', error);
        // Return a fake success response to prevent retries
        return { success: false, reason: 'error', error };
      }
    },
    onSuccess: (data) => {
      // Only update the cache if we got a real success response with diagnosisViewedAt
      if (data && data.diagnosisViewedAt) {
        // Update the cached submission data with the new diagnosisViewedAt timestamp
        queryClient.setQueryData<WorkbookSubmission | null>(
          ['jackier', 'submission'], 
          (oldData) => oldData ? {
            ...oldData,
            diagnosisViewedAt: data.diagnosisViewedAt,
          } : null
        );
      }
    },
    onError: (err) => {
      console.error('Error marking diagnosis as viewed:', err);
    }
  });
  
  // Track if we've already tried to mark as viewed to prevent infinite loops
  const [hasTriedToMarkViewed, setHasTriedToMarkViewed] = useState(false);
  
  const markDiagnosisViewed = async () => {
    // Prevent multiple attempts in the same session
    if (hasTriedToMarkViewed || !userSubmission?.id) return;
    
    setHasTriedToMarkViewed(true);
    try {
      await markDiagnosisViewedMutation.mutateAsync(userSubmission.id);
    } catch (error) {
      console.error('Failed to mark diagnosis as viewed:', error);
    }
  };

  // Combine errors from both queries
  const combinedError = workbookError || submissionError || error;
  
  return {
    workbook,
    userSubmission,
    isLoading: isWorkbookLoading || isSubmissionLoading,
    isWorkbookLoading,
    isSubmissionLoading,
    isWorkbookSuccess,
    isSubmissionSuccess,
    error: combinedError ? String(combinedError) : null,
    saveDraft,
    submitWorkbook,
    markDiagnosisViewed,
    isSaving: saveDraftMutation.isPending,
    isSubmitting: submitWorkbookMutation.isPending,
  };
}
