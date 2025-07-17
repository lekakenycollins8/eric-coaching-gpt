'use client';

import React, { useState, useEffect } from 'react';
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
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Create form schema using our extracted utility
  const formSchema = createWorkbookFormSchema(workbook);
  
  // Set up the form with react-hook-form and zod validation
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: userSubmission?.answers || {},
    mode: 'onChange'
  });
  
  const { handleSubmit, formState, watch, reset } = methods;
  const { errors, isDirty } = formState;
  
  // Watch form values for auto-save
  const formValues = watch();
  
  // Calculate progress
  useEffect(() => {
    if (!workbook) return;
    
    const totalQuestions = workbook.sections.reduce((acc, section) => {
      return acc + section.questions.filter(q => q.type !== 'info').length;
    }, 0);
    
    const answeredQuestions = Object.keys(formValues).filter(key => {
      const value = formValues[key] as unknown;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'number') return true;
      return !!value;
    }).length;
    
    const newProgress = Math.round((answeredQuestions / totalQuestions) * 100);
    setProgress(newProgress);
  }, [formValues, workbook]);
  
  // Auto-save functionality
  useEffect(() => {
    if (!isDirty || !workbook) return;
    
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
  }, [formValues, isDirty, workbook, saveDraft]);
  
  // Load initial data from user submission if available
  useEffect(() => {
    if (userSubmission?.answers && Object.keys(userSubmission.answers).length > 0) {
      reset(userSubmission.answers);
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
        <h1 className="text-3xl font-bold mb-2">{workbook.title}</h1>
        <p className="text-muted-foreground mb-4">{workbook.description}</p>
        
        <div className="mb-6">
          <WorkbookProgress progress={progress} />
        </div>
      </div>
      
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {workbook.sections.map((section, index) => (
                <TabsTrigger 
                  key={index} 
                  value={`section-${index}`}
                  className="text-xs md:text-sm"
                >
                  Section {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {workbook.sections.map((section, sectionIndex) => (
              <TabsContent key={sectionIndex} value={`section-${sectionIndex}`}>
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
