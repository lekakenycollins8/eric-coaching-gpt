import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTracker } from '@/hooks/useTrackers';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

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
  
  // Local state for form fields
  const [content, setContent] = useState(initialContent || trackerData?.reflection?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
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
        await updateReflection({
          content: debouncedContent,
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving reflection:', error);
        toast({
          title: 'Error',
          description: 'Failed to save your reflection. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    saveReflection();
  }, [debouncedContent]);
  
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
          <div>
            <Textarea
              placeholder="Share your thoughts on your progress, challenges, and insights gained during this tracking period..."
              className="min-h-[200px] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {isSaving ? (
              <span>Saving...</span>
            ) : lastSaved ? (
              <span>Last saved at {lastSaved.toLocaleTimeString()}</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
