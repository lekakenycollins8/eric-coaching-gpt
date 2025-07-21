import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon, ArrowRightIcon } from 'lucide-react';
import { CoachingPrompt } from '@/components/coaching/CoachingPrompt';
import { useCoachingPrompt } from '@/hooks/useCoachingPrompt';

interface FollowupSubmissionSuccessProps {
  submissionId: string;
  worksheetId: string;
  worksheetTitle: string;
  shouldPromptCoaching?: boolean;
}

/**
 * Component displayed after successful follow-up worksheet submission
 * Includes coaching prompt when appropriate based on server-side logic
 */
export const FollowupSubmissionSuccess: React.FC<FollowupSubmissionSuccessProps> = ({
  submissionId,
  worksheetId,
  worksheetTitle,
  shouldPromptCoaching = false
}) => {
  const router = useRouter();
  const [showCoachingPrompt, setShowCoachingPrompt] = useState(shouldPromptCoaching);
  const { dismissPrompt, isDismissing } = useCoachingPrompt();
  
  const handleDismissCoachingPrompt = async () => {
    setShowCoachingPrompt(false);
    // Track that the user dismissed the prompt using our hook
    await dismissPrompt({ submissionId });
  };
  
  const handleViewDashboard = () => {
    router.push('/dashboard');
  };
  
  const handleViewResults = () => {
    router.push(`/dashboard/worksheets/results/${submissionId}`);
  };
  
  return (
    <div className="space-y-6">
      {showCoachingPrompt && (
        <CoachingPrompt 
          submissionId={submissionId}
          showPrompt={true}
          onDismiss={handleDismissCoachingPrompt}
        />
      )}
      
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            <CardTitle className="text-green-800">Follow-up Worksheet Submitted</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Your {worksheetTitle} follow-up worksheet has been successfully submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-green-700">
          <p>
            Thank you for completing this follow-up worksheet. Your responses help track your progress
            and identify areas where additional support may be beneficial.
          </p>
          <p className="mt-2">
            The coaching team has been notified of your submission and will review your responses.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleViewDashboard}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            Return to Dashboard
          </Button>
          <Button 
            onClick={handleViewResults}
            className="bg-green-600 hover:bg-green-700"
          >
            View Results
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
