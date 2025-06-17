import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTracker } from '@/hooks/useTrackers';
import { useSubscription } from '@/hooks/useSubscription';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TrackerReflectionFormProps {
  trackerId: string;
  initialContent?: string;
}

export default function TrackerReflectionForm({
  trackerId,
  initialContent = '',
}: TrackerReflectionFormProps) {
  const { toast } = useToast();
  const { updateReflection, trackerData } = useTracker(trackerId);
  const { subscription } = useSubscription();
  
  // Check if user has an active subscription
  // Both 'active' and 'past_due' statuses are considered valid
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'past_due';
  const showSubscriptionAlert = subscription === null || !hasActiveSubscription;
  
  // Local state for form fields
  const [content, setContent] = useState(initialContent || trackerData?.reflection?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<boolean>(false);
  
  // Debounce content changes to reduce API calls
  const debouncedContent = useDebounce(content, 1500);
  
  // Update local state if reflection changes from API
  useEffect(() => {
    if (trackerData?.reflection?.content && !content) {
      setContent(trackerData.reflection.content);
    }
  }, [trackerData?.reflection]);
  
  // Save reflection when debounced content changes
  useEffect(() => {
    const saveReflection = async () => {
      // Don't save if content is empty and hasn't changed from initial state
      if (debouncedContent === initialContent && debouncedContent === '') {
        return;
      }
      
      try {
        setIsSaving(true);
        setSubscriptionError(false);
        
        // Only attempt to save if user has an active subscription
        if (!hasActiveSubscription) {
          setSubscriptionError(true);
          return;
        }
        
        const result = await updateReflection({
          content: debouncedContent,
        });
        
        if (result.success) {
          setLastSaved(new Date());
        } else if (result.error === 'subscription_required') {
          setSubscriptionError(true);
        }
      } catch (error) {
        console.error('Error saving reflection:', error);
      } finally {
        setIsSaving(false);
      }
    };
    
    saveReflection();
  }, [debouncedContent, hasActiveSubscription]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Final Reflection</CardTitle>
        <CardDescription>
          Take time to reflect on your progress over the past 5 days. What did you learn? What would you do differently?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showSubscriptionAlert && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Subscription Required</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>An active subscription is required to save your reflection. Please subscribe to continue.</p>
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
              placeholder="Share your thoughts on your progress, challenges, and insights gained during this tracking period..."
              className="min-h-[200px] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
