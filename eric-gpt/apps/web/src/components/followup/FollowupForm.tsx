'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useFollowupSubmission, useFollowupDraft } from '@/hooks/useFollowupSubmission';
import { DynamicField } from '../worksheets/DynamicField';
import { FollowupSubmissionSuccess } from '@/components/followup/FollowupSubmissionSuccess';
import type { FollowupWorksheet, FollowupSubmissionData } from '@/types/followup';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FollowupFormProps {
  worksheet: FollowupWorksheet;
  originalSubmissionId: string;
  onSuccess?: (data: any) => void;
}

export function FollowupForm({ worksheet, originalSubmissionId, onSuccess }: FollowupFormProps) {
  const { toast } = useToast();
  const [needsHelp, setNeedsHelp] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Ensure worksheet data is fully loaded before rendering
  useEffect(() => {
    // Check for both possible data structures (fields or sections with questions)
    if (worksheet && (worksheet.fields || (worksheet.sections && worksheet.sections.length > 0))) {
      setIsReady(true);
    }
  }, [worksheet]);
  
  // Get submission mutation and draft functions
  const { mutate: submitFollowup, isPending } = useFollowupSubmission();
  const { draftExists, saveDraft, loadDraft, clearDraft } = useFollowupDraft(worksheet?.id || '');
  
  // Set up form with React Hook Form
  const form = useForm<Record<string, any>>({
    defaultValues: async () => {
      // Try to load draft if it exists
      const draft = loadDraft();
      if (draft?.answers) {
        return draft.answers;
      }
      return {};
    }
  });
  
  // Save draft when form values change
  const handleFormChange = (values: Record<string, any>) => {
    saveDraft({
      followupId: worksheet.id,
      originalSubmissionId,
      answers: values,
      needsHelp
    });
  };
  
  // Submit the form
  const onSubmit = (values: Record<string, any>) => {
    const submissionData: FollowupSubmissionData = {
      followupId: worksheet.id,
      originalSubmissionId,
      answers: values,
      needsHelp
    };
    
    submitFollowup(submissionData, {
      onSuccess: (data) => {
        // Clear the draft after successful submission
        clearDraft();
        
        // Show success toast
        toast({
          title: 'Follow-up submitted successfully',
          description: 'Your follow-up has been submitted and is being analyzed.',
          variant: 'default',
        });
        
        // Set submission success state and store result
        setSubmissionSuccess(true);
        setSubmissionResult(data);
        
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess(data);
        }
      }
    });
  };
  
  // If submission was successful, show success component
  if (submissionSuccess && submissionResult) {
    return (
      <FollowupSubmissionSuccess 
        result={{
          ...submissionResult,
          originalSubmissionId: originalSubmissionId,
          needsHelp: needsHelp
        }}
        worksheetId={worksheet?.id || ''}
      />
    );
  }
  
  // Show loading state if worksheet data is not ready
  if (!isReady || !worksheet) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{worksheet.title}</CardTitle>
        <CardDescription>{worksheet.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onChange={form.handleSubmit(handleFormChange)} onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {/* Handle both data structures - fields or sections with questions */}
              {worksheet.fields ? (
                // Original structure with fields
                worksheet.fields.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    control={form.control}
                    errors={form.formState.errors}
                  />
                ))
              ) : worksheet.sections ? (
                // New structure with sections containing questions
                worksheet.sections.flatMap((section, sectionIndex) => [
                  // Add section title
                  <div key={`section-${sectionIndex}`} className="mb-4">
                    <h3 className="text-lg font-medium">{section.title}</h3>
                  </div>,
                  // Map questions to fields
                  ...section.questions.map((question) => (
                    <DynamicField
                      key={question.id}
                      field={{
                        id: question.id,
                        label: question.text,
                        type: question.type,
                        options: question.options ? question.options.map(opt => ({ label: opt, value: opt })) : undefined,
                        required: question.required
                      }}
                      control={form.control}
                      errors={form.formState.errors}
                    />
                  ))
                ])
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No questions found in this worksheet.
                </div>
              )}
              
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch
                  id="needs-help"
                  checked={needsHelp}
                  onCheckedChange={setNeedsHelp}
                />
                <Label htmlFor="needs-help">I would like coaching help with this area</Label>
              </div>
            </div>
            
            <div className="mt-6">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit Follow-up'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {draftExists && (
          <p className="text-sm text-muted-foreground">
            Draft saved automatically
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

export function FollowupFormSkeleton() {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
