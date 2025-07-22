'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

interface DismissPromptParams {
  submissionId: string;
}

interface DismissPromptResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
}

/**
 * API function to dismiss a coaching prompt
 */
async function dismissCoachingPrompt(submissionId: string): Promise<DismissPromptResponse> {
  const response = await fetch('/api/coaching/dismiss-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ submissionId }),
  });
  
  // Check if response is OK before trying to parse JSON
  if (!response.ok) {
    // Get content type to handle non-JSON responses
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to dismiss coaching prompt');
    } else {
      // Handle non-JSON error response
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error('Server returned a non-JSON error:', response.status, errorText);
      throw new Error(`Server error: ${response.status}`);
    }
  }
  
  return await response.json();
}

/**
 * Hook to manage coaching prompt interactions
 * Handles dismissing prompts and tracking user interactions
 */
export function useCoachingPrompt() {
  const [emailSent, setEmailSent] = useState<boolean>(false);
  
  const mutation = useMutation<
    DismissPromptResponse, 
    Error, 
    string, 
    unknown
  >({
    mutationFn: dismissCoachingPrompt,
    onSuccess: (data) => {
      // Track if an email was sent as part of the dismissal process
      setEmailSent(data.emailSent || false);
    },
    onError: (error) => {
      console.error('Error dismissing coaching prompt:', error);
      toast.error('Failed to track prompt interaction');
    }
  });

  /**
   * Dismiss a coaching prompt and track the interaction
   */
  const dismissPrompt = ({ submissionId }: DismissPromptParams) => {
    if (!submissionId) return;
    mutation.mutate(submissionId);
  };

  return {
    dismissPrompt,
    isDismissing: mutation.isPending,
    isDismissed: mutation.isSuccess,
    emailSent,
    error: mutation.error ? mutation.error.message : null
  };
}
