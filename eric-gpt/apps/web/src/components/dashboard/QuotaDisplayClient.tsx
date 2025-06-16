'use client';

import React from 'react';
import useQuota from '@/hooks/useQuota';
import { useSubscription } from '@/hooks/useSubscription';
import QuotaDisplay from '@/components/usage/QuotaDisplay';

/**
 * Client component wrapper for QuotaDisplay that fetches quota data
 */
const QuotaDisplayClient: React.FC = () => {
  // The useQuota hook now checks subscription status internally
  // and returns 0 values for non-subscribed users
  const { used, limit, isLoading, error } = useQuota();
  const { subscription } = useSubscription();
  
  // Check if user has an active subscription
  const hasActiveSubscription = subscription?.status === 'active';
  
  return (
    <QuotaDisplay
      used={used}
      limit={limit}
      isLoading={isLoading}
      error={error}
      showUpgradeLink={true}
      hasActiveSubscription={hasActiveSubscription}
    />
  );
};

export default QuotaDisplayClient;
