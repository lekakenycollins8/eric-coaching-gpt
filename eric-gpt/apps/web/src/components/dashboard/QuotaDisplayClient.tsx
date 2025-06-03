'use client';

import React from 'react';
import useQuota from '@/hooks/useQuota';
import QuotaDisplay from '@/components/usage/QuotaDisplay';

/**
 * Client component wrapper for QuotaDisplay that fetches quota data
 */
const QuotaDisplayClient: React.FC = () => {
  const { used, limit, isLoading, error } = useQuota();
  
  return (
    <QuotaDisplay
      used={used}
      limit={limit}
      isLoading={isLoading}
      error={error}
      showUpgradeLink={true}
    />
  );
};

export default QuotaDisplayClient;
