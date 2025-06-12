'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorksheet } from '@/hooks/useWorksheets';
import { useWorksheetSubmission } from '@/hooks/useWorksheetSubmission';
import WorksheetForm from '@/components/worksheets/WorksheetForm';
import FeedbackPanel from '@/components/worksheets/FeedbackPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QuotaExceededAlert } from '@/components/usage/QuotaExceededAlert';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function WorksheetPage() {
  const params = useParams();
  const router = useRouter();
  const worksheetId = params.id as string;
  
  const { worksheet, isLoading, error } = useWorksheet(worksheetId);
  const worksheetSubmission = useWorksheetSubmission();
  const { 
    submitWorksheet, 
    saveDraft,
    loadDraft,
    isSubmitting, 
    feedback, 
    error: submissionError,
    remainingQuota,
    isOverQuota,
    quotaLimit,
    quotaUsed,
    submissionId
  } = worksheetSubmission;

  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // Load draft on initial render - only run once when worksheetId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (worksheetId) {
      const draft = loadDraft(worksheetId);
      if (draft && draft.answers) {
        setFormData(draft.answers);
      }
    }
  }, [worksheetId]); // Removed loadDraft from dependencies to prevent infinite loop

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await submitWorksheet({
        worksheetId,
        answers: data
      });
      toast({
        title: "Worksheet Submitted",
        description: "Your worksheet has been submitted successfully.",
      });
    } catch (err) {
      // Error is handled by the hook and displayed in the UI
      console.error('Submission error:', err);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your worksheet.",
        variant: "destructive",
      });
    }
  };

  const handleSaveDraft = async (data: Record<string, any>) => {
    const success = await saveDraft(worksheetId, data);
    return success;
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Link href="/dashboard/worksheets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Worksheets
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Link href="/dashboard/worksheets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Worksheets
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Loading worksheet...</p>
        </div>
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            The requested worksheet could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/dashboard/worksheets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Worksheets
          </Button>
        </Link>
      </div>

      {submissionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>
            {submissionError}
          </AlertDescription>
        </Alert>
      )}

      {isOverQuota && quotaUsed !== null && quotaLimit !== null && (
        <QuotaExceededAlert
          used={quotaUsed}
          limit={quotaLimit}
          className="mb-6"
        />
      )}

      <WorksheetForm 
        worksheet={worksheet} 
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        initialData={formData}
        isSubmitting={isSubmitting}
        disabled={isOverQuota} 
      />

      <FeedbackPanel 
        feedback={feedback}
        isLoading={isSubmitting}
        error={submissionError}
        remainingQuota={remainingQuota}
        submissionId={submissionId}
        worksheetTitle={worksheet.title}
      />
    </div>
  );
}
