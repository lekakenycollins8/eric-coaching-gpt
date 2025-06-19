import { useCallback } from 'react';
import useSWR, { mutate, type SWRResponse } from 'swr';
import { useSubscription } from './useSubscription';
import { toast } from '@/components/ui/use-toast';
import { hasActiveSubscription, hasFeatureAccess } from '@/lib/subscription-utils';

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
  const queryString = status ? `?status=${status}` : '';
  const { data, error, isLoading }: SWRResponse<Tracker[], Error> = useSWR(
    `/api/trackers${queryString}`,
    fetcher
  );

  // Pull subscription and loading at top level
  const { subscription, loading: subLoading } = useSubscription();

  const createTracker = useCallback(
    async (trackerData: CreateTrackerData) => {
      // Wait for subscription to load
      while (subLoading) {
        await new Promise((r) => setTimeout(r, 300));
      }

      // Check access
      if (!hasFeatureAccess(subscription, 'trackerCreate')) {
        toast({
          title: 'Subscription Required',
          description: 'An active subscription is required to create trackers.',
          variant: 'destructive',
        });
        throw new Error('subscription_required');
      }

      // Ensure endDate
      const dataToSend = { ...trackerData };
      if (!dataToSend.endDate) {
        const start = new Date(dataToSend.startDate);
        start.setDate(start.getDate() + 5);
        dataToSend.endDate = start.toISOString();
      }

      const res = await fetch('/api/trackers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create tracker');
      }
      const newTracker = await res.json();

      // Revalidate
      await mutate('/api/trackers');
      if (status) await mutate(`/api/trackers?status=${status}`);

      return newTracker;
    },
    [status, subscription, subLoading]
  );

  return { trackers: data, isLoading, error, createTracker };
}

export function useTracker(trackerId: string) {
  const { data, error, isLoading, mutate: revalidate }: SWRResponse<TrackerWithDetails, Error> = useSWR(
    trackerId ? `/api/trackers/${trackerId}` : null,
    fetcher
  );

  const { subscription, loading: subLoading } = useSubscription();

  const updateTracker = useCallback(
    async (updateData: UpdateTrackerData) => {
      const res = await fetch(`/api/trackers/${trackerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update tracker');
      }
      const updated = await res.json();
      await revalidate();
      await mutate('/api/trackers');
      return updated;
    },
    [trackerId, revalidate]
  );

  const updateEntry = useCallback(
    async (entryData: TrackerEntryData) => {
      while (subLoading) {
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!hasFeatureAccess(subscription, 'trackerEntryUpdate')) {
        toast({
          title: 'Subscription Required',
          description: 'Active subscription required to update entries.',
          variant: 'destructive',
        });
        return { success: false, error: 'subscription_required' };
      }
      const res = await fetch(`/api/trackers/${trackerId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });
      if (!res.ok) {
        let errorMessage = 'Failed to update entry';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      // Parse the response once
      let updated;
      try {
        updated = await res.json();  
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Failed to parse server response');
      }
      await revalidate();
      return { success: true, data: updated };
    },
    [trackerId, subscription, subLoading, revalidate]
  );

  const updateReflection = useCallback(
    async (reflectionData: TrackerReflectionData) => {
      while (subLoading) {
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!hasFeatureAccess(subscription, 'trackerReflectionUpdate')) {
        toast({
          title: 'Subscription Required',
          description: 'Active subscription required to update reflections.',
          variant: 'destructive',
        });
        return { success: false, error: 'subscription_required' };
      }
      const res = await fetch(`/api/trackers/${trackerId}/reflection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reflectionData),
      });
      if (!res.ok) {
        let errorMessage = 'Failed to update reflection';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      // Parse the response once
      let updated;
      try {
        updated = await res.json();  
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Failed to parse server response');
      }
      await revalidate();
      return { success: true, data: updated };
    },
    [trackerId, subscription, subLoading, revalidate]
  );

  const downloadPdf = useCallback(() => {
    window.open(`/api/trackers/${trackerId}/pdf`, '_blank');
    return true;
  }, [trackerId]);

  const deleteTracker = useCallback(async () => {
    const res = await fetch(`/api/trackers/${trackerId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete tracker');
    }
    await mutate('/api/trackers');
    return true;
  }, [trackerId]);

  return {
    trackerData: data,
    isLoading,
    error,
    updateTracker,
    updateEntry,
    updateReflection,
    downloadPdf,
    deleteTracker,
    revalidate,
  };
}

export function useActiveTrackersCount() {
  const { data, error, isLoading }: SWRResponse<Tracker[], Error> = useSWR(
    '/api/trackers?status=active',
    fetcher
  );
  return { count: data?.length || 0, isLoading, error };
}
