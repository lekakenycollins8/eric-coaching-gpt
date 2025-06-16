import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTracker } from '@/hooks/useTrackers';
import { useSubscription } from '@/hooks/useSubscription';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TrackerEntryFormProps {
  trackerId: string;
  day: number;
  initialCompleted?: boolean;
  initialNotes?: string;
}

export default function TrackerEntryForm({
  trackerId,
  day,
  initialCompleted = false,
  initialNotes = '',
}: TrackerEntryFormProps) {
  const { toast } = useToast();
  const { updateEntry } = useTracker(trackerId);
  const { subscription } = useSubscription();
  
  // Check if user has an active subscription
  // Consider subscription as not active if it's null (still loading) or not 'active'
  const hasActiveSubscription = subscription?.status === 'active';
  const showSubscriptionAlert = subscription === null || !hasActiveSubscription;
  
  // Local state for form fields
  const [completed, setCompleted] = useState(initialCompleted);
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<boolean>(false);
  
  // Debounce notes changes to reduce API calls
  const debouncedNotes = useDebounce(notes, 1000);
  
  // Track if this is the initial render
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // Set isInitialRender to false after component mounts
  useEffect(() => {
    setIsInitialRender(false);
  }, []);
  
  // Save entry when completed status changes (but not on initial render)
  useEffect(() => {
    // Skip saving on initial render
    if (isInitialRender) return;
    
    const saveEntry = async () => {
      try {
        setIsSaving(true);
        setSubscriptionError(false);
        
        // Only attempt to save if user has an active subscription
        if (!hasActiveSubscription) {
          setSubscriptionError(true);
          return;
        }
        
        const result = await updateEntry({
          day,
          completed,
          notes,
        });
        
        if (result.success) {
          setLastSaved(new Date());
        } else if (result.error === 'subscription_required') {
          setSubscriptionError(true);
        }
      } catch (error) {
        console.error('Error saving entry:', error);
      } finally {
        setIsSaving(false);
      }
    };
    
    saveEntry();
  }, [completed, isInitialRender, hasActiveSubscription]);
  
  // Save entry when debounced notes change
  useEffect(() => {
    // Skip saving on initial render
    if (isInitialRender) return;
    
    // Skip if notes haven't actually changed from initial state
    if (debouncedNotes === initialNotes) {
      return;
    }
    
    const saveEntry = async () => {
      try {
        setIsSaving(true);
        setSubscriptionError(false);
        
        // Only attempt to save if user has an active subscription
        if (!hasActiveSubscription) {
          setSubscriptionError(true);
          return;
        }
        
        const result = await updateEntry({
          day,
          completed,
          notes: debouncedNotes,
        });
        
        if (result.success) {
          setLastSaved(new Date());
        } else if (result.error === 'subscription_required') {
          setSubscriptionError(true);
        }
      } catch (error) {
        console.error('Error saving entry:', error);
      } finally {
        setIsSaving(false);
      }
    };
    
    saveEntry();
  }, [debouncedNotes, isInitialRender, hasActiveSubscription]);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Day {day}</span>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`completed-${day}`}
              checked={completed}
              onCheckedChange={(checked) => setCompleted(checked as boolean)}
              className="hidden"
              disabled={!hasActiveSubscription}
            />
            <Label
              htmlFor={`completed-${day}`}
              className={`flex items-center ${hasActiveSubscription ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            >
              {completed ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-gray-300" />
              )}
              <span className="ml-2 text-sm font-medium">
                {completed ? 'Completed' : 'Mark as completed'}
              </span>
            </Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showSubscriptionAlert && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Subscription Required</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>An active subscription is required to update tracker entries.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild variant="default">
                    <Link href="/dashboard/subscription">Subscribe Now</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/trackers">Back to Trackers</Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div>
            <Textarea
              placeholder="What did you accomplish today? What challenges did you face?"
              className="min-h-[120px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!hasActiveSubscription}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {isSaving ? (
              <span>Saving...</span>
            ) : lastSaved ? (
              <span>Last saved at {lastSaved.toLocaleTimeString()}</span>
            ) : subscriptionError ? (
              <span className="text-destructive">Not saved - subscription required</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
