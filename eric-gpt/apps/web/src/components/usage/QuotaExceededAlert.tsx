'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import UsageMeter from './UsageMeter';

interface QuotaExceededAlertProps {
  used: number;
  limit: number;
  className?: string;
}

/**
 * Component to display when a user has exceeded their quota
 */
const QuotaExceededAlert: React.FC<QuotaExceededAlertProps> = ({
  used,
  limit,
  className,
}) => {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold mb-2">
        Monthly Submission Limit Reached
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-4">
          <p>
            You've used all {limit} of your available worksheet submissions for this month.
            Upgrade your plan to continue receiving AI coaching feedback.
          </p>
          
          <UsageMeter
            current={used}
            limit={limit}
            size="sm"
          />
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm">
              Your quota will reset at the beginning of next month
            </p>
            
            <Link href="/dashboard/subscription">
              <Button size="sm" className="flex items-center gap-1">
                Upgrade Plan
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export { QuotaExceededAlert };
