'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFollowupWorksheet } from '@/hooks/useFollowupWorksheet';
import { useWorksheetSubmissions } from '@/hooks/useOriginalSubmission';
import { FollowupForm, FollowupFormSkeleton } from './FollowupForm';
import { AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import type { FollowupWorksheet } from '@/types/followup';

interface PillarFollowupProps {
  followupId: string;
  pillarId?: string;
}

// Define the API response type to match the actual structure
interface WorksheetApiResponse {
  success: boolean;
  worksheet: FollowupWorksheet;
  previousSubmission?: any;
}

export function PillarFollowup({ followupId, pillarId }: PillarFollowupProps) {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  
  // Derive pillar ID from props or URL params
  const derivedPillarId = pillarId || (params?.pillarId as string);
  
  // Ensure we have a valid pillar ID
  const effectivePillarId = derivedPillarId || '';
  
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Fetch follow-up worksheet with optional submission context
  const { 
    data: worksheetResponse, 
    isLoading: isLoadingWorksheet,
    error: worksheetError,
    refetch: refetchWorksheet
  } = useFollowupWorksheet(followupId, selectedSubmissionId);
  
  // Type assertion to ensure TypeScript recognizes the correct structure
  const typedResponse = worksheetResponse as WorksheetApiResponse | undefined;
  const worksheet = typedResponse?.worksheet;
  
  // Fetch previous pillar submissions
  const {
    data: submissionsData,
    isLoading: isLoadingSubmissions,
    error: submissionsError
  } = useWorksheetSubmissions(effectivePillarId);
  
  const submissions = submissionsData?.submissions || [];
  const isLoading = isLoadingWorksheet || isLoadingSubmissions;
  const error = worksheetError || submissionsError;
  
  // Render the follow-up form when data is ready
  const renderForm = () => {
    if (!typedResponse?.success || !typedResponse?.worksheet) {
      console.log('Cannot render form - missing worksheet data:', typedResponse);
      return null;
    }
    
    console.log('Rendering form with worksheet:', typedResponse.worksheet);
    return (
      <FollowupForm 
        worksheet={typedResponse.worksheet} 
        originalSubmissionId={selectedSubmissionId!} 
        onSuccess={handleSuccess}
      />
    );
  };
  
  // Handle submission selection
  const handleSelectSubmission = async (submissionId: string) => {
    try {
      setSelectedSubmissionId(submissionId);
      setShowForm(false); // Hide form while loading
      
      // Invalidate the query cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['followupWorksheet', followupId, submissionId] });
      
      // Explicitly refetch the data with the new submissionId
      const result = await refetchWorksheet();
      console.log('PillarFollowup - Refetched worksheet data:', result.data);
      
      // Log the structure of the data to help debug
      console.log('PillarFollowup - Worksheet data structure:', JSON.stringify(result.data, null, 2));
      
      // Type assertion for the result data
      const responseData = result.data as WorksheetApiResponse | undefined;
      
      // Verify we have valid data before showing the form
      if (responseData && 
          responseData.success === true && 
          responseData.worksheet && 
          responseData.worksheet.id && 
          responseData.worksheet.title && 
          ((responseData.worksheet.fields && responseData.worksheet.fields.length > 0) || 
           (responseData.worksheet.sections && responseData.worksheet.sections.length > 0))) {
        // Now that we have the updated data, show the form
        setShowForm(true);
      } else {
        console.error('PillarFollowup - Invalid worksheet data structure:', responseData);
        alert('The follow-up worksheet data is invalid. Please try again.');
      }
    } catch (error) {
      console.error('PillarFollowup - Error selecting submission:', error);
      alert('Failed to load follow-up worksheet. Please try again.');
    }
  };
  
  // Handle successful submission
  const handleSuccess = () => {
    router.push(`/dashboard/pillars/${effectivePillarId}`);
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
  
  // Check if we have a valid worksheet response
  if (!typedResponse?.success || !typedResponse?.worksheet) {
    console.log('Missing or invalid worksheet data:', typedResponse);
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
          You need to complete the {effectivePillarId} pillar worksheet before you can do a follow-up.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div>
      {showForm ? (
        <div className="space-y-6">
          <Button 
            variant="outline" 
            onClick={() => setShowForm(false)}
            className="mb-4"
          >
            ← Back to Submissions
          </Button>
          
          {renderForm()}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Worksheet</CardTitle>
            <CardDescription>
              Select a previous submission to use as context for this follow-up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                {submissions.map((submission: any) => (
                  <Button 
                    key={submission.id} 
                    variant="outline" 
                    className="justify-start text-left font-normal" 
                    onClick={() => handleSelectSubmission(submission.id)}
                  >
                    {submission.title || `Submission from ${new Date(submission.createdAt).toLocaleDateString()}`}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
