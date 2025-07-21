'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { useJackierWorkbook } from '@/hooks/useJackierWorkbook';

// Import our custom components
import { WorkbookQuestion } from '@/components/jackier/WorkbookQuestion';
import { WorkbookSection } from '@/components/jackier/WorkbookSection';
import { WorkbookProgress } from '@/components/jackier/WorkbookProgress';
import { AutoSaveStatus } from '@/components/jackier/AutoSaveStatus';
import { LoadingState } from '@/components/jackier/LoadingState';
import { ErrorState } from '@/components/jackier/ErrorState';
import { createWorkbookFormSchema } from '@/components/jackier/WorkbookFormSchema';

export default function WorkbookPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    workbook, 
    userSubmission, 
    isLoading, 
    error, 
    saveDraft, 
    submitWorkbook,
    isSaving,
    isSubmitting
  } = useJackierWorkbook();
  
  const [activeTab, setActiveTab] = useState('section-0');
  const [progress, setProgress] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Create form schema using our extracted utility
  // Only create the schema when workbook is loaded to prevent errors
  const formSchema = workbook ? createWorkbookFormSchema(workbook) : createWorkbookFormSchema(null);
  
  // Set up the form with react-hook-form and zod validation
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {}, // Start with empty defaults, we'll set them properly in useEffect
    mode: 'onChange'
  });
  
  const { handleSubmit, formState, watch, reset } = methods;
  const { errors, isDirty } = formState;
  
  // Define type for form values to fix TypeScript errors
  interface FormValues {
    [key: string]: unknown;
  }
  
  // Use refs to track form values and prevent re-renders
  const formValuesRef = useRef<FormValues>({});
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Watch form values without causing re-renders
  const formValues = watch();
  
  // Update the ref whenever form values change
  useEffect(() => {
    formValuesRef.current = formValues;
    
    // Clear any existing progress timer
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
    }
    
    // Debounce progress calculation to prevent excessive updates
    progressTimerRef.current = setTimeout(() => {
      // Only calculate progress if workbook is loaded
      if (!workbook || !Array.isArray(workbook.sections)) return;
      
      try {
        const totalQuestions = workbook.sections.reduce((acc, section) => {
          return acc + section.questions.filter(q => q.type !== 'info').length;
        }, 0);
        
        const answeredQuestions = Object.keys(formValues).filter(key => {
          // Cast formValues to FormValues type to fix TypeScript error
          const typedFormValues = formValues as FormValues;
          const value = typedFormValues[key];
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'number') return true;
          return !!value;
        }).length;
        
        const newProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
        setProgress(newProgress);
      } catch (err) {
        console.error('Error calculating progress:', err);
        setProgress(0);
      }
    }, 300);
    
    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workbook, JSON.stringify(formValues)]);
  
  // Auto-save functionality using refs to prevent re-renders
  useEffect(() => {
    // Make sure workbook is loaded and form is dirty before attempting to auto-save
    if (!isDirty || !workbook || !Array.isArray(workbook.sections)) return;
    
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set a new timer for auto-save
    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const success = await saveDraft(formValuesRef.current as Record<string, unknown>);
        if (success) {
          setAutoSaveStatus('saved');
          // Reset status after 2 seconds
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } else {
          setAutoSaveStatus('error');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    // Cleanup function
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, workbook, saveDraft]);
  
  // Load initial data from user submission if available
  useEffect(() => {
    // Only proceed if we have a valid submission with answers
    if (userSubmission?.answers && Object.keys(userSubmission.answers).length > 0) {
      console.log('Resetting form with saved answers:', userSubmission.answers);
      
      // Reset the form with the saved answers
      reset(userSubmission.answers);
      
      // Also update the formValuesRef to ensure auto-save has the latest data
      formValuesRef.current = userSubmission.answers;
    } else {
      console.log('No saved answers found or empty answers object');
    }
  }, [userSubmission, reset]);
  
  // Handle manual save
  const handleSave = async () => {
    setAutoSaveStatus('saving');
    try {
      const success = await saveDraft(formValues as Record<string, unknown>);
      if (success) {
        toast({
          title: "Progress saved",
          description: "Your workbook progress has been saved successfully.",
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
      const result = await submitWorkbook(data);
      
      toast({
        title: "Workbook submitted",
        description: "Your workbook has been submitted successfully.",
      });
      
      // Redirect to the diagnosis page
      router.push('/dashboard/jackier/diagnosis');
    } catch (err) {
      console.error('Submission error:', err);
      toast({
        title: "Submission failed",
        description: "There was a problem submitting your workbook.",
        variant: "destructive",
      });
    }
  };
  
  // Navigate to next section
  const goToNextSection = () => {
    if (!workbook) return;
    
    const currentIndex = parseInt(activeTab.split('-')[1]);
    if (currentIndex < workbook.sections.length - 1) {
      setActiveTab(`section-${currentIndex + 1}`);
    }
  };
  
  // Navigate to previous section
  const goToPrevSection = () => {
    const currentIndex = parseInt(activeTab.split('-')[1]);
    if (currentIndex > 0) {
      setActiveTab(`section-${currentIndex - 1}`);
    }
  };
  
  // We've moved the renderQuestion function to the WorkbookQuestion component
  
  if (isLoading) {
    return <LoadingState message="Loading workbook..." />;
  }
  
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
  
  if (!workbook) {
    return (
      <ErrorState
        title="Not Found"
        description="The Jackier Method Workbook could not be found."
      />
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 max-w-5xl">
      {/* Header with navigation and save button */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/dashboard/jackier">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jackier Method
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AutoSaveStatus status={autoSaveStatus} />
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving || !isDirty}
            className="ml-auto sm:ml-0"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Progress
          </Button>
        </div>
      </div>
      
      {/* Workbook title and progress */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">{workbook.title}</h1>
        <p className="text-muted-foreground mb-5">{workbook.description}</p>
        
        <div>
          <WorkbookProgress progress={progress} />
        </div>
      </div>
      
      {/* Form with tabs */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab navigation - scrollable on mobile */}
            <div className="overflow-x-auto pb-2">
              <TabsList className="inline-flex min-w-full sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {workbook.sections.map((section, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={`section-${index}`}
                    className="text-xs sm:text-sm whitespace-nowrap"
                  >
                    Section {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {/* Tab content */}
            {workbook.sections.map((section, sectionIndex) => (
              <TabsContent key={sectionIndex} value={`section-${sectionIndex}`} className="pt-2">
                <WorkbookSection
                  section={section}
                  isFirstSection={sectionIndex === 0}
                  isLastSection={sectionIndex === workbook.sections.length - 1}
                  onPrevious={goToPrevSection}
                  onNext={goToNextSection}
                  isSubmitting={isSubmitting}
                >
                  {section.questions.map((question, questionIndex) => (
                    <WorkbookQuestion
                      key={questionIndex}
                      question={question}
                      isLastQuestion={questionIndex === section.questions.length - 1}
                    />
                  ))}
                </WorkbookSection>
              </TabsContent>
            ))}
          </Tabs>
        </form>
      </FormProvider>
    </div>
  );
}
