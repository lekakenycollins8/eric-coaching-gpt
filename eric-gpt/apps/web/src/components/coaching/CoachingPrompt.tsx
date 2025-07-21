import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, CheckCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface CoachingPromptProps {
  submissionId: string;
  showPrompt: boolean;
  onDismiss?: () => void;
}

/**
 * Component that displays a coaching prompt when appropriate
 * Appears after a user completes follow-up worksheets to encourage scheduling a coaching session
 */
export const CoachingPrompt: React.FC<CoachingPromptProps> = ({
  submissionId,
  showPrompt,
  onDismiss
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  
  if (!showPrompt || !session) {
    return null;
  }
  
  const handleScheduleClick = () => {
    // Navigate to the scheduling page with the submission ID
    router.push(`/dashboard/coaching/schedule?submission=${submissionId}`);
  };
  
  return (
    <Card className="border-blue-200 bg-blue-50 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-blue-800">Ready for Personalized Coaching?</CardTitle>
        <CardDescription className="text-blue-700">
          Your follow-up worksheet insights suggest you might benefit from a coaching session.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-blue-700">
        <p className="mb-2">
          Based on your responses, a personalized coaching session with Eric Jackier could help you:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Address specific leadership challenges you're facing</li>
          <li>Develop targeted strategies for your growth areas</li>
          <li>Create an action plan for continued improvement</li>
        </ul>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={onDismiss}
          className="text-blue-700 border-blue-300 hover:bg-blue-100"
        >
          Remind Me Later
        </Button>
        <Button 
          onClick={handleScheduleClick}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Schedule Session
        </Button>
      </CardFooter>
    </Card>
  );
};

/**
 * Component that displays a confirmation after a coaching session is scheduled
 */
export const CoachingConfirmation: React.FC<{ scheduledDate?: Date }> = ({ scheduledDate }) => {
  return (
    <Card className="border-green-200 bg-green-50 mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
          <CardTitle className="text-green-800">Coaching Session Scheduled</CardTitle>
        </div>
        <CardDescription className="text-green-700">
          {scheduledDate 
            ? `Your session is scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}`
            : 'Your coaching session has been scheduled.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-green-700">
        <p>
          You'll receive a calendar invitation and reminder email with connection details.
          Please prepare any specific questions or topics you'd like to discuss during your session.
        </p>
      </CardContent>
    </Card>
  );
};
