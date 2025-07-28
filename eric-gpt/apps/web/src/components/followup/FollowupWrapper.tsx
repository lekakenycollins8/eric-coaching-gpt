'use client';

import { useEffect, useState } from 'react';
import { PillarFollowup } from './PillarFollowup';
import { WorkbookFollowup } from './WorkbookFollowup';
import { useFollowupType } from '@/hooks/useFollowupWorksheet';
import { Skeleton } from '@/components/ui/skeleton';

interface FollowupWrapperProps {
  followupId: string;
}

export function FollowupWrapper({ followupId }: FollowupWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const followupType = useFollowupType(followupId);
  
  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Show skeleton during SSR to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Render the appropriate follow-up component based on type
  if (followupType === 'pillar') {
    return <PillarFollowup followupId={followupId} />;
  } else if (followupType === 'workbook') {
    return <WorkbookFollowup followupId={followupId} />;
  }
  
  // Default fallback if type can't be determined
  return <PillarFollowup followupId={followupId} />;
}
