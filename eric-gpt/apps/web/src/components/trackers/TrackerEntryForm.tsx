import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTracker } from '@/hooks/useTrackers';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Circle } from 'lucide-react';

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
  
  // Local state for form fields
  const [completed, setCompleted] = useState(initialCompleted);
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Debounce notes changes to reduce API calls
  const debouncedNotes = useDebounce(notes, 1000);
  
  // Save entry when completed status changes
  useEffect(() => {
    const saveEntry = async () => {
      try {
        setIsSaving(true);
        await updateEntry({
          day,
          completed,
          notes,
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving entry:', error);
        toast({
          title: 'Error',
          description: 'Failed to save your entry. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    saveEntry();
  }, [completed]);
  
  // Save entry when debounced notes change
  useEffect(() => {
    const saveEntry = async () => {
      // Don't save if notes are empty and haven't changed from initial state
      if (debouncedNotes === initialNotes && debouncedNotes === '') {
        return;
      }
      
      try {
        setIsSaving(true);
        await updateEntry({
          day,
          completed,
          notes: debouncedNotes,
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving entry:', error);
        toast({
          title: 'Error',
          description: 'Failed to save your entry. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    saveEntry();
  }, [debouncedNotes]);
  
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
            />
            <Label
              htmlFor={`completed-${day}`}
              className="cursor-pointer flex items-center"
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
          <div>
            <Textarea
              placeholder="What did you accomplish today? What challenges did you face?"
              className="min-h-[120px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
