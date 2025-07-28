'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFollowupWorksheet } from '@/hooks/useFollowupWorksheet';
import { useWorksheetSubmissions } from '@/hooks/useOriginalSubmission';
import { FollowupForm, FollowupFormSkeleton } from './FollowupForm';
import { usePillarId } from '@/hooks/useFollowupWorksheet';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface PillarFollowupProps {
  followupId: string;
}

export function PillarFollowup({ followupId }: PillarFollowupProps) {
  const router = useRouter();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Get pillar ID from follow-up ID
  const pillarId = usePillarId(followupId);
  
  // Fetch follow-up worksheet
  const { 
    data: worksheet, 
    isLoading: isLoadingWorksheet,
    error: worksheetError 
  } = useFollowupWorksheet(followupId);
  
  // Fetch previous worksheet submissions for this pillar
  const {
    data: submissionsData,
    isLoading: isLoadingSubmissions,
    error: submissionsError
  } = useWorksheetSubmissions(pillarId || undefined);
  
  const submissions = submissionsData?.submissions || [];
  const isLoading = isLoadingWorksheet || isLoadingSubmissions;
  const error = worksheetError || submissionsError;
  
  // Handle submission selection
  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setShowForm(true);
  };
  
  // Handle successful submission
  const handleSuccess = () => {
    router.push('/dashboard/progress');
  };
  
  if (isLoading) {
    return <FollowupFormSkeleton />;
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load follow-up worksheet. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!worksheet) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          The requested follow-up worksheet could not be found.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (submissions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Previous Submissions</AlertTitle>
        <AlertDescription>
          You need to complete the {pillarId} worksheet before you can do a follow-up.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {!showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Select a Previous Submission</CardTitle>
            <CardDescription>
              Choose which {worksheet.title} submission you want to follow up on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission._id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">{pillarId} Submission</CardTitle>
                        <CardDescription>
                          Completed on {new Date(submission.completedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button onClick={() => handleSelectSubmission(submission._id)}>
                        Select
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Button 
            variant="outline" 
            onClick={() => setShowForm(false)}
            className="mb-4"
          >
            ← Back to Submissions
          </Button>
          
          <FollowupForm 
            worksheet={worksheet} 
            originalSubmissionId={selectedSubmissionId!}
            onSuccess={handleSuccess}
          />
        </div>
      )}
    </div>
  );
}
