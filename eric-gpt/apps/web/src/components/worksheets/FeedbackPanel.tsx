'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FeedbackPanelProps {
  feedback: string | null;
  isLoading: boolean;
  error: string | null;
  remainingQuota: number | null;
}

/**
 * Component to display AI coaching feedback for worksheet submissions
 */
const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedback,
  isLoading,
  error,
  remainingQuota
}) => {
  if (error) {
    return (
      <Alert variant="destructive" className="mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Eric's Coaching Feedback</CardTitle>
          <CardDescription>
            Based on your responses, here's your personalized coaching feedback
            {remainingQuota !== null && (
              <span className="block text-sm mt-1">
                You have {remainingQuota} {remainingQuota === 1 ? 'submission' : 'submissions'} remaining this month
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate max-w-none">
            {feedback.split('\n').map((paragraph: string, idx: number) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackPanel;
