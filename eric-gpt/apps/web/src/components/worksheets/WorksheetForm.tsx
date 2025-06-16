'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Worksheet, Field } from '@/types/worksheet';
import { useSubscription } from '@/hooks/useSubscription';
// Import field components
import TextInput from '@/components/worksheets/fields/TextInput';
import TextareaInput from '@/components/worksheets/fields/TextareaInput';
import RatingInput from '@/components/worksheets/fields/RatingInput';
import CheckboxInput from '@/components/worksheets/fields/CheckboxInput';
import InfoField from '@/components/worksheets/fields/InfoField';
import MultiSelectInput from '@/components/worksheets/fields/MultiSelectInput';

interface WorksheetFormProps {
  worksheet: Worksheet;
  onSubmit: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
  initialData?: Record<string, any>;
  onSaveDraft?: (data: Record<string, any>) => void;
  disabled?: boolean;
}

const WorksheetForm: React.FC<WorksheetFormProps> = ({
  worksheet,
  onSubmit,
  isSubmitting = false,
  initialData = {},
  onSaveDraft,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const { subscription } = useSubscription();
  
  // Check if user has an active subscription
  const hasActiveSubscription = subscription?.status === 'active';
  const isFormDisabled = disabled || !hasActiveSubscription;
  
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    getValues,
  } = useForm<Record<string, any>>({
    defaultValues: initialData,
  });
  
  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const processSubmit: SubmitHandler<Record<string, any>> = (data) => {
    // Filter out info fields as they don't have user input
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => {
        const field = worksheet.fields.find((f: Field) => f.name === key);
        return field && field.type !== 'info';
      })
    );
    
    onSubmit(filteredData);
  };
  
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    
    try {
      setIsSavingDraft(true);
      const currentValues = getValues();
      
      // Filter out info fields as they don't have user input
      const filteredData = Object.fromEntries(
        Object.entries(currentValues).filter(([key]) => {
          const field = worksheet.fields.find((f: Field) => f.name === key);
          return field && field.type !== 'info';
        })
      );
      
      await onSaveDraft(filteredData);
      toast({
        title: "Draft Saved",
        description: "Your progress has been saved as a draft.",
      });
    } catch (error) {
      toast({
        title: "Error Saving Draft",
        description: "There was a problem saving your draft.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{worksheet.title}</CardTitle>
        <CardDescription>{worksheet.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActiveSubscription && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Subscription Required</AlertTitle>
            <AlertDescription>
              An active subscription is required to submit worksheets and receive AI coaching feedback.
              <div className="mt-2">
                <Link 
                  href="/dashboard/subscription" 
                  className="inline-flex items-center px-3 py-1.5 border border-red-700 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Subscribe Now &rarr;
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(processSubmit)} id="worksheet-form">
          <div className="space-y-6">
            {worksheet.fields.map((field: Field) => (
              <div key={field.name} className="space-y-2">
                {field.type === 'info' ? (
                  <InfoField label={field.label} />
                ) : (
                  <Controller
                    name={field.name}
                    control={control}
                    defaultValue=""
                    rules={{ required: field.required ? 'This field is required' : false }}
                    render={({ field: formField }) => {
                      // Explicitly handle each field type to avoid null returns
                      // Ensure we always return a React element
                      switch (field.type) {
                        case 'text':
                          return (
                            <TextInput
                              label={field.label}
                              {...formField}
                              error={errors[field.name]?.message as string}
                            />
                          );
                        case 'textarea':
                          return (
                            <TextareaInput
                              label={field.label}
                              {...formField}
                              error={errors[field.name]?.message as string}
                            />
                          );
                        case 'rating':
                          return (
                            <RatingInput
                              label={field.label}
                              options={field.options || []}
                              {...formField}
                              error={errors[field.name]?.message as string}
                            />
                          );
                        case 'checkbox':
                          return (
                            <CheckboxInput
                              label={field.label}
                              {...formField}
                              error={errors[field.name]?.message as string}
                            />
                          );
                        case 'multiselect':
                          return (
                            <MultiSelectInput
                              label={field.label}
                              options={field.options || []}
                              {...formField}
                              error={errors[field.name]?.message as string}
                            />
                          );
                        default:
                          // Return a fallback element instead of null
                          return <div>Unsupported field type: {field.type}</div>;
                      }
                    }}
                  />
                )}
                {field.type !== 'info' && field.type !== 'checkbox' && <Separator />}
              </div>
            ))}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          type="button" 
          onClick={handleSaveDraft} 
          disabled={isSavingDraft || !isDirty || disabled}
        >
          {isSavingDraft ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Draft'
          )}
        </Button>
        <Button 
          type="submit" 
          form="worksheet-form" 
          disabled={isSubmitting || isFormDisabled}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : !hasActiveSubscription ? (
            'Subscription Required'
          ) : disabled ? (
            'Quota Exceeded'
          ) : (
            'Submit for Feedback'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorksheetForm;
