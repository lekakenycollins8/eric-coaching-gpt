import { useCallback } from 'react';
import useSWR, { mutate, type SWRResponse } from 'swr';
import { useSubscription } from './useSubscription';
import { toast } from '@/components/ui/use-toast';
import { hasActiveSubscription } from '@/lib/subscription-utils';

interface Tracker {
  _id: string;
  userId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'abandoned';
  startDate: string;
  endDate: string;
  submissionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrackerEntry {
  _id: string;
  trackerId: string;
  userId: string;
  day: number;
  completed: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface TrackerReflection {
  _id: string;
  trackerId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface TrackerWithDetails {
  tracker: Tracker;
  entries: TrackerEntry[];
  reflection: TrackerReflection | null;
}

interface CreateTrackerData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  submissionId?: string;
}

interface UpdateTrackerData {
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'abandoned';
}

interface TrackerEntryData {
  day: number;
  completed?: boolean;
  notes?: string;
}

interface TrackerReflectionData {
  content: string;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    const errorData = await res.json();
    (error as any).info = errorData;
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

export function useTrackers(status?: string) {
  // Build query string for filtering by status
  const queryString = status ? `?status=${status}` : '';
  
  // Fetch trackers with optional status filter
  const { data, error, isLoading }: SWRResponse<Tracker[], Error> = useSWR(
    `/api/trackers${queryString}`,
    fetcher
  );

  // Get subscription status
  const { subscription } = useSubscription();
  
  // Create a new tracker
  const createTracker = useCallback(
    async (trackerData: CreateTrackerData) => {
      try {
        // Check if user has an active subscription
        if (!hasActiveSubscription(subscription)) {
          toast({
            title: "Subscription Required",
            description: "An active subscription is required to create trackers. Please subscribe to continue.",
            variant: "destructive"
          });
          throw new Error('Active subscription required');
        }
        
        // Calculate endDate as 5 days after startDate if not provided
        const dataToSend = { ...trackerData };
        if (!dataToSend.endDate) {
          const startDate = new Date(dataToSend.startDate);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 5);
          dataToSend.endDate = endDate.toISOString();
        }

        const response = await fetch('/api/trackers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create tracker');
        }

        const newTracker = await response.json();
        
        // Revalidate the trackers cache
        await mutate('/api/trackers');
        if (status) {
          await mutate(`/api/trackers?status=${status}`);
        }
        
        return newTracker;
      } catch (error) {
        console.error('Error creating tracker:', error);
        throw error;
      }
    },
    [status]
  );

  return {
    trackers: data,
    isLoading,
    error,
    createTracker,
  };
}

export function useTracker(trackerId: string) {
  // Fetch a specific tracker with its entries and reflection
  const { data, error, isLoading, mutate: revalidate }: SWRResponse<TrackerWithDetails, Error> = useSWR(
    trackerId ? `/api/trackers/${trackerId}` : null,
    fetcher
  );

  // Update tracker details
  const updateTracker = useCallback(
    async (updateData: UpdateTrackerData) => {
      try {
        const response = await fetch(`/api/trackers/${trackerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update tracker');
        }

        const updatedTracker = await response.json();
        
        // Revalidate the cache
        await revalidate();
        await mutate('/api/trackers');
        
        return updatedTracker;
      } catch (error) {
        console.error('Error updating tracker:', error);
        throw error;
      }
    },
    [trackerId, revalidate]
  );

  // Delete tracker
  const deleteTracker = useCallback(
    async () => {
      try {
        const response = await fetch(`/api/trackers/${trackerId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete tracker');
        }

        // Revalidate the trackers list
        await mutate('/api/trackers');
        
        return true;
      } catch (error) {
        console.error('Error deleting tracker:', error);
        throw error;
      }
    },
    [trackerId]
  );

  // Get subscription status
  const { subscription } = useSubscription();

  // Update or create a tracker entry
  const updateEntry = useCallback(
    async (entryData: TrackerEntryData) => {
      try {
        // Check if user has an active subscription
        if (!hasActiveSubscription(subscription)) {
          toast({
            title: "Subscription Required",
            description: "An active subscription is required to update tracker entries. Please subscribe to continue.",
            variant: "destructive"
          });
          return { success: false, error: 'subscription_required' };
        }

        const response = await fetch(`/api/trackers/${trackerId}/entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entryData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update entry');
        }

        const updatedEntry = await response.json();
        
        // Revalidate the tracker data
        await revalidate();
        
        return { success: true, data: updatedEntry };
      } catch (error) {
        console.error('Error updating entry:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update tracker entry",
          variant: "destructive"
        });
        return { success: false, error: 'update_failed' };
      }
    },
    [trackerId, revalidate, subscription]
  );

  // Update or create tracker reflection
  const updateReflection = useCallback(
    async (reflectionData: TrackerReflectionData) => {
      try {
        // Check if user has an active subscription
        if (!hasActiveSubscription(subscription)) {
          toast({
            title: "Subscription Required",
            description: "An active subscription is required to update tracker reflections. Please subscribe to continue.",
            variant: "destructive"
          });
          return { success: false, error: 'subscription_required' };
        }

        const response = await fetch(`/api/trackers/${trackerId}/reflection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reflectionData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update reflection');
        }

        const updatedReflection = await response.json();
        
        // Revalidate the tracker data
        await revalidate();
        
        return { success: true, data: updatedReflection };
      } catch (error) {
        console.error('Error updating reflection:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update tracker reflection",
          variant: "destructive"
        });
        return { success: false, error: 'update_failed' };
      }
    },
    [trackerId, revalidate, subscription]
  );

  // Generate and download PDF
  const downloadPdf = useCallback(
    async () => {
      try {
        // Use window.open to trigger the download in a new tab
        window.open(`/api/trackers/${trackerId}/pdf`, '_blank');
        return true;
      } catch (error) {
        console.error('Error downloading PDF:', error);
        throw error;
      }
    },
    [trackerId]
  );

  return {
    trackerData: data,
    isLoading,
    error,
    updateTracker,
    deleteTracker,
    updateEntry,
    updateReflection,
    downloadPdf,
    revalidate,
  };
}

// Hook to get active trackers count for the dashboard
export function useActiveTrackersCount() {
  const { data, error, isLoading }: SWRResponse<Tracker[], Error> = useSWR(
    '/api/trackers?status=active',
    fetcher
  );

  return {
    count: data?.length || 0,
    isLoading,
    error,
  };
}
