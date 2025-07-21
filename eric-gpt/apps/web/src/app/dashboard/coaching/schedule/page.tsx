'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, addDays, setHours, setMinutes, isBefore, isWeekend } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CalendarIcon, ClockIcon, CheckCircleIcon } from 'lucide-react';
import { CoachingConfirmation } from '@/components/coaching/CoachingPrompt';
import { useCoachingSchedule } from '@/hooks/useCoachingSchedule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Available time slots for coaching sessions
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', 
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
];

export default function CoachingSchedulePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const submissionId = searchParams.get('submission');
  
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | undefined>(undefined);
  
  const {
    scheduleCoaching,
    isSubmitting,
    isSuccess: isScheduled,
    error: schedulingError,
    schedulingDetails,
    dismissScheduling
  } = useCoachingSchedule();
  
  // Disable dates in the past and weekends
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates, weekends (0 = Sunday, 6 = Saturday)
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };
  
  const handleScheduleSession = async () => {
    if (!date || !timeSlot || !session?.user) {
      return;
    }
    
    try {
      // Parse the time slot to get hours and minutes
      const [hourStr, minuteStr, period] = timeSlot.split(/[:\s]/);
      let hour = parseInt(hourStr);
      const minute = parseInt(minuteStr || '0');
      
      // Convert to 24-hour format
      if (period === 'PM' && hour < 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      
      // Create a date object with the selected date and time
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hour, minute, 0, 0);
      setScheduledDateTime(scheduledDate);
      
      // Format the date and time for the API request
      const formattedDate = format(scheduledDate, 'yyyy-MM-dd');
      const formattedTime = format(scheduledDate, 'HH:mm');
      
      // Use the scheduleCoaching hook to submit the request
      await scheduleCoaching({
        date: formattedDate,
        time: formattedTime,
        notes,
        submissionId: submissionId || undefined
      });
    } catch (error) {
      console.error('Error scheduling coaching session:', error);
    }
  };
  
  if (isScheduled) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Coaching Session</h1>
        <CoachingConfirmation scheduledDate={scheduledDateTime} />
        
        <Card>
          <CardHeader>
            <CardTitle>Your Coaching Session Details</CardTitle>
            <CardDescription>
              Please review the details of your scheduled coaching session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-gray-600">{date ? format(date, 'EEEE, MMMM d, yyyy') : 'Not selected'}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-gray-600">{timeSlot}</p>
              </div>
            </div>
            
            {notes && (
              <div className="border-t pt-4 mt-4">
                <p className="font-medium">Your Notes</p>
                <p className="text-gray-600 whitespace-pre-line">{notes}</p>
              </div>
            )}
            
            <div className="bg-green-50 p-4 rounded-md border border-green-100 mt-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <p className="font-medium text-green-800">Confirmed</p>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your coaching session has been scheduled. You'll receive a confirmation email with connection details.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => dismissScheduling('/dashboard')}>
              Return to Dashboard
            </Button>
            <Button onClick={() => dismissScheduling('/dashboard/worksheets')}>
              View Worksheets
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Schedule a Coaching Session</h1>
      
      {schedulingError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{schedulingError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Select a Date</CardTitle>
            <CardDescription>
              Choose an available date for your coaching session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={disabledDays}
              className="rounded-md border"
              initialFocus
            />
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select a Time</CardTitle>
              <CardDescription>
                Choose an available time slot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Share any specific topics or questions you'd like to discuss.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any notes for your coach..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleScheduleSession}
                disabled={!date || !timeSlot || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
