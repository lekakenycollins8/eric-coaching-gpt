'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import UsageMeter from './UsageMeter';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';

interface QuotaDisplayProps {
  used: number;
  limit: number;
  isLoading?: boolean;
  error?: string | null;
  showUpgradeLink?: boolean;
  compact?: boolean;
  className?: string;
  hasActiveSubscription?: boolean;
}

/**
 * Component to display quota information and usage meter
 */
const QuotaDisplay: React.FC<QuotaDisplayProps> = ({
  used,
  limit,
  isLoading = false,
  error = null,
  showUpgradeLink = true,
  compact = false,
  className,
  hasActiveSubscription: propHasActiveSubscription,
}) => {
  // Get subscription status if not provided via props
  const { subscription } = useSubscription();
  const hasActiveSubscription = propHasActiveSubscription !== undefined 
    ? propHasActiveSubscription 
    : subscription?.status === 'active';
  const remaining = Math.max(0, limit - used);
  const isOverQuota = used >= limit;
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className={compact ? 'p-4' : undefined}>
          <CardTitle className="animate-pulse bg-muted h-6 w-1/2 rounded"></CardTitle>
          <CardDescription className="animate-pulse bg-muted h-4 w-3/4 rounded mt-2"></CardDescription>
        </CardHeader>
        <CardContent className={compact ? 'p-4 pt-0' : undefined}>
          <div className="animate-pulse bg-muted h-3 w-full rounded"></div>
          <div className="animate-pulse bg-muted h-4 w-1/3 rounded mt-3"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className={compact ? 'p-4' : undefined}>
        <CardTitle>AI Coaching Quota</CardTitle>
        <CardDescription>
          {!hasActiveSubscription
            ? 'Subscription required for worksheet submissions'
            : isOverQuota 
              ? 'You have reached your monthly submission limit'
              : 'Your monthly worksheet submission quota'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className={compact ? 'p-4 pt-0' : undefined}>
        {hasActiveSubscription ? (
          <UsageMeter
            current={used}
            limit={limit}
            label="Worksheet Submissions"
            size={compact ? 'sm' : 'md'}
          />
        ) : (
          <div className="py-2 text-center text-destructive font-medium">
            No worksheet submissions available
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            {hasActiveSubscription ? (
              <>
                <p className="text-sm font-medium">
                  {remaining} {remaining === 1 ? 'submission' : 'submissions'} remaining
                </p>
                {isOverQuota && (
                  <p className="text-sm text-destructive mt-1">
                    Upgrade your plan for more submissions
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-medium text-destructive">
                Subscribe to unlock worksheet submissions
              </p>
            )}
          </div>
          
          {showUpgradeLink && (
            <Link href="/dashboard/subscription">
              <Button 
                variant={!hasActiveSubscription || isOverQuota ? 'default' : 'outline'} 
                size="sm"
              >
                {!hasActiveSubscription ? 'Subscribe Now' : isOverQuota ? 'Upgrade Now' : 'Manage Plan'}
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotaDisplay;
