import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ScheduleCoachingParams {
  date: string;
  time: string;
  notes?: string;
  submissionId?: string;
}

interface ScheduleCoachingResponse {
  success: boolean;
  message: string;
  schedulingId?: string;
  emailSent?: boolean;
  details?: {
    date: string;
    time: string;
    notes?: string;
    submissionId?: string;
    user: {
      id: string;
      name?: string;
      email?: string;
    };
  };
}

/**
 * API function to schedule a coaching session
 */
async function scheduleCoachingSession(params: ScheduleCoachingParams): Promise<ScheduleCoachingResponse> {
  const response = await fetch('/api/coaching/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  
  // Check if response is OK before trying to parse JSON
  if (!response.ok) {
    // Get content type to handle non-JSON responses
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to schedule coaching session');
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
 * Hook for scheduling coaching sessions
 */
export function useCoachingSchedule() {
  // We still need some local state for UI management
  const [schedulingDetails, setSchedulingDetails] = useState<ScheduleCoachingResponse['details'] | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  const mutation = useMutation<
    ScheduleCoachingResponse,
    Error,
    ScheduleCoachingParams,
    unknown
  >({
    mutationFn: scheduleCoachingSession,
    onSuccess: (data) => {
      setSchedulingDetails(data.details || null);
      setSchedulingId(data.schedulingId || null);
      setEmailSent(data.emailSent || false);
      
      toast({
        title: 'Coaching Session Scheduled',
        description: data.emailSent 
          ? 'Your coaching session has been scheduled successfully and a confirmation email has been sent.'
          : 'Your coaching session has been scheduled successfully.',
      });
    },
    onError: (error) => {
      console.error('Error scheduling coaching session:', error);
      
      toast({
        title: 'Scheduling Error',
        description: error.message || 'Failed to schedule coaching session',
        variant: 'destructive',
      });
    }
  });

  /**
   * Schedule a coaching session
   */
  const scheduleCoaching = (params: ScheduleCoachingParams) => {
    if (!session?.user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to schedule a coaching session.',
        variant: 'destructive',
      });
      return null;
    }

    mutation.mutate(params);
    return null; // For consistency with previous API
  };

  /**
   * Reset the scheduling state
   */
  const resetScheduling = () => {
    mutation.reset();
    setSchedulingDetails(null);
    setSchedulingId(null);
  };

  /**
   * Dismiss the scheduling request and navigate to a specified path
   */
  const dismissScheduling = (navigateTo?: string) => {
    resetScheduling();
    
    if (navigateTo) {
      router.push(navigateTo);
    }
  };

  return {
    scheduleCoaching,
    resetScheduling,
    dismissScheduling,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error ? mutation.error.message : null,
    schedulingDetails,
    schedulingId,
    emailSent,
  };
}
