import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTrackers } from '@/hooks/useTrackers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Form schema validation
const formSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters long' })
    .max(500, { message: 'Description must be less than 500 characters' }),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  submissionId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateTrackerFormProps {
  submissionId?: string;
  initialTitle?: string;
  initialDescription?: string;
  onSuccess?: () => void;
}

export default function CreateTrackerForm({
  submissionId,
  initialTitle = '',
  initialDescription = '',
  onSuccess,
}: CreateTrackerFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { createTracker } = useTrackers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialTitle,
      description: initialDescription,
      startDate: new Date(),
      submissionId: submissionId,
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Format date as ISO string for API
      const formattedData = {
        ...data,
        startDate: data.startDate.toISOString(),
      };
      
      // Create tracker via API
      await createTracker(formattedData);
      
      toast({
        title: 'Tracker created',
        description: 'Your tracker has been created successfully.',
        variant: 'default',
      });
      
      // Navigate to trackers page or call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/trackers');
      }
    } catch (error) {
      console.error('Error creating tracker:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tracker. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Tracker</CardTitle>
        <CardDescription>
          Track your progress over 5 days and reflect on your journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What are you tracking?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what you're tracking and why it's important..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <CardFooter className="flex justify-end px-0 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Creating...' : 'Create Tracker'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
