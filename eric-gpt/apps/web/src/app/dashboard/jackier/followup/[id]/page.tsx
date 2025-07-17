'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useJackierWorkbook } from '@/hooks/useJackierWorkbook';
// Import directly using relative path to fix module resolution issue
import { useFollowupWorksheet } from '../../../../../hooks/useFollowupWorksheet';

// Import our custom components
import { WorkbookQuestion } from '@/components/jackier/WorkbookQuestion';
import { AutoSaveStatus } from '@/components/jackier/AutoSaveStatus';
import { LoadingState } from '@/components/jackier/LoadingState';
import { ErrorState } from '@/components/jackier/ErrorState';
import { createFollowupWorksheetFormSchema } from '@/components/jackier/FollowupWorksheetFormSchema';

export default function FollowupWorksheetPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const worksheetId = params.id as string;
  
  const { userSubmission } = useJackierWorkbook();
  // Get the submission ID from the userSubmission or use an empty string if not available
  const submissionId = userSubmission?.id || '';
  
  const { 
    worksheet, 
    isLoading, 
    error, 
    submitFollowupWorksheet,
    saveDraft,
    existingAnswers,
    isSubmitting,
    isSaving
  } = useFollowupWorksheet(worksheetId, submissionId);
  
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Create a dynamic schema based on the worksheet questions
  const formSchema = worksheet ? createFollowupWorksheetFormSchema(worksheet) : null;
  
  
  // Set up the form with react-hook-form and zod validation
  const methods = useForm({
    resolver: formSchema ? zodResolver(formSchema) : undefined,
    defaultValues: existingAnswers || {},
    mode: 'onChange'
  });
  
  const { handleSubmit, formState, watch, reset } = methods;
  const { errors, isDirty } = formState;
  
  // Watch form values for auto-save
  const formValues = watch();
  
  // Auto-save functionality
  useEffect(() => {
    if (!isDirty || !worksheet) return;
    
    // Clear any existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Set a new timer for auto-save
    const timer = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const success = await saveDraft(formValues as Record<string, unknown>);
        if (success) {
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } else {
          setAutoSaveStatus('error');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    setAutoSaveTimer(timer);
    
    // Cleanup function
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formValues, isDirty, worksheet, saveDraft]);
  
  // Load initial data if available
  useEffect(() => {
    if (existingAnswers && Object.keys(existingAnswers).length > 0) {
      reset(existingAnswers);
    }
  }, [existingAnswers, reset]);
  
  // Handle manual save
  const handleSave = async () => {
    setAutoSaveStatus('saving');
    try {
      const success = await saveDraft(formValues as Record<string, unknown>);
      if (success) {
        toast({
          title: "Progress saved",
          description: "Your worksheet progress has been saved successfully.",
        });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } else {
        setAutoSaveStatus('error');
        toast({
          title: "Save failed",
          description: "There was a problem saving your progress.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      setAutoSaveStatus('error');
      toast({
        title: "Save failed",
        description: "There was a problem saving your progress.",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await submitFollowupWorksheet(data);
      
      toast({
        title: "Worksheet submitted",
        description: "Your follow-up worksheet has been submitted successfully.",
      });
      
      // Redirect back to the Jackier Method page
      router.push('/dashboard/jackier');
    } catch (err) {
      console.error('Submission error:', err);
      toast({
        title: "Submission failed",
        description: "There was a problem submitting your worksheet.",
        variant: "destructive",
      });
    }
  };
  
  // Show loading state
  if (isLoading) {
    return <LoadingState message="Loading worksheet..." />;
  }
  
  // Show error state
  if (error) {
    return (
      <ErrorState
        title="Error"
        description={error}
        backLink="/dashboard/jackier"
        backLinkText="Back to Jackier Method"
      />
    );
  }
  
  if (!worksheet) {
    return (
      <ErrorState
        title="Not Found"
        description="The requested worksheet could not be found."
        backLink="/dashboard/jackier"
        backLinkText="Back to Jackier Method"
      />
    );
  }
  
  if (!userSubmission?.diagnosis) {
    return (
      <ErrorState
        title="Diagnosis Required"
        description="You need to complete the Jackier Method Workbook and receive a diagnosis before accessing follow-up worksheets."
        backLink="/dashboard/jackier"
        backLinkText="Back to Jackier Method"
        actionButton={
          <Button asChild>
            <Link href="/dashboard/jackier/workbook">Start Workbook</Link>
          </Button>
        }
      />
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex justify-between items-center">
        <Link href="/dashboard/jackier">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jackier Method
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <AutoSaveStatus status={autoSaveStatus} />
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving || !isDirty}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Progress
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{worksheet.title}</h1>
        <p className="text-muted-foreground mb-4">{worksheet.description}</p>
      </div>
      
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Worksheet</CardTitle>
              <CardDescription>
                Complete this worksheet based on your leadership diagnosis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {worksheet.questions.map((question, questionIndex) => (
                <div key={questionIndex}>
                  <WorkbookQuestion 
                    question={question} 
                    isLastQuestion={questionIndex === worksheet.questions.length - 1} 
                  />
                  {questionIndex < worksheet.questions.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || Object.keys(errors).length > 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Worksheet'
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </FormProvider>
    </div>
  );
}
