'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useFollowupType } from '@/hooks/useFollowupWorksheet';
import { CoachingPrompt } from '@/components/coaching/CoachingPrompt';
import type { FollowupSubmissionData } from '@/types/followup';

interface FollowupSubmissionSuccessProps {
  followupId: string;
  submissionData: FollowupSubmissionData;
  submissionResult: any;
}

/**
 * Component displayed after successful follow-up submission
 * Includes coaching prompt integration when user indicates they need help
 */
export function FollowupSubmissionSuccess({ 
  followupId, 
  submissionData, 
  submissionResult 
}: FollowupSubmissionSuccessProps) {
  const [showCoachingPrompt, setShowCoachingPrompt] = useState(false);
  const followupType = useFollowupType(followupId);
  
  // Determine if coaching prompt should be shown based on submission data
  useEffect(() => {
    if (submissionData.needsHelp) {
      setShowCoachingPrompt(true);
    }
  }, [submissionData.needsHelp]);
  
  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <CardTitle>Follow-up Submitted Successfully</CardTitle>
          </div>
          <CardDescription>
            Thank you for completing your {followupType} follow-up assessment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Your responses have been recorded and analyzed. This helps track your progress
            and provides valuable insights for your leadership development journey.
          </p>
          
          {submissionResult?.diagnosis && (
            <div className="mt-4 p-4 bg-white rounded-md border">
              <h3 className="font-medium mb-2">Initial Analysis:</h3>
              <p className="text-sm">{submissionResult.diagnosis}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/dashboard/followup">
            <Button variant="outline">
              Return to Dashboard
            </Button>
          </Link>
          
          <Link href={`/dashboard/progress${followupType === 'pillar' ? `/${followupId.split('-')[0]}` : ''}`}>
            <Button>
              View Progress <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
      
      {showCoachingPrompt && (
        <CoachingPrompt
          submissionId={submissionResult?.id || ''}
          showPrompt={true}
          onDismiss={() => setShowCoachingPrompt(false)}
        />
      )}
    </div>
  );
}
