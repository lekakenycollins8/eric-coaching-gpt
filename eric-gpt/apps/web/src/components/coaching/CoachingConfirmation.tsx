import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircleIcon } from 'lucide-react';

interface CoachingConfirmationProps {
  scheduledDate?: Date;
}

export function CoachingConfirmation({ scheduledDate }: CoachingConfirmationProps) {
  if (!scheduledDate) return null;

  const formattedDate = format(scheduledDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(scheduledDate, 'h:mm a');

  return (
    <Card className="mb-8 bg-green-50 border-green-100">
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <div className="bg-green-100 p-2 rounded-full mr-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-green-800">Coaching Session Scheduled</h2>
            <p className="text-green-700">Your session has been confirmed.</p>
          </div>
        </div>

        <div className="pl-16 space-y-2 text-green-700">
          <p>
            <span className="font-medium">Date:</span> {formattedDate}
          </p>
          <p>
            <span className="font-medium">Time:</span> {formattedTime}
          </p>
          <p className="mt-4 text-sm">
            You will receive an email with connection details for your coaching session.
            Please check your inbox and make sure to add the event to your calendar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
