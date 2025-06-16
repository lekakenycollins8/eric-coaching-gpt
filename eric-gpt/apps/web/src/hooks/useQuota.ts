'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from './useSubscription';

interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  isLoading: boolean;
  error: string | null;
  isOverQuota: boolean;
  percentage: number;
}

/**
 * Hook to fetch and manage user quota information
 */
export function useQuota() {
  const { subscription } = useSubscription();
  const hasActiveSubscription = subscription?.status === 'active';
  
  const [state, setState] = useState<QuotaState>({
    used: 0,
    limit: 0,
    remaining: 0,
    isLoading: true,
    error: null,
    isOverQuota: false,
    percentage: 0,
  });

  const fetchQuota = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // If user doesn't have an active subscription, return zeros
      if (!hasActiveSubscription) {
        setState({
          used: 0,
          limit: 0,
          remaining: 0,
          isLoading: false,
          error: null,
          isOverQuota: false,
          percentage: 0,
        });
        return { used: 0, limit: 0, remaining: 0, isOverQuota: false, percentage: 0 };
      }
      
      // Fetch quota information from the API only for subscribed users
      const response = await fetch('/api/submissions?limit=1');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quota information');
      }
      
      const data = await response.json();
      
      // Calculate quota values
      const used = data.total || 0;
      // If remainingQuota is provided directly by the API, use it
      const remaining = data.remainingQuota !== undefined ? data.remainingQuota : 0;
      // Calculate limit based on used + remaining
      const limit = used + remaining;
      const isOverQuota = remaining <= 0;
      const percentage = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
      
      setState({
        used,
        limit,
        remaining,
        isLoading: false,
        error: null,
        isOverQuota,
        percentage,
      });
      
      return { used, limit, remaining, isOverQuota, percentage };
    } catch (error) {
      console.error('Error fetching quota:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch quota information',
      }));
      return null;
    }
  }, [hasActiveSubscription]);

  // Fetch quota on initial mount
  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    ...state,
    fetchQuota,
  };
}

export default useQuota;
