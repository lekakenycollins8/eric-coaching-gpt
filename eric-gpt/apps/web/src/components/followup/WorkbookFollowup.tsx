'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useFollowupWorksheet } from '@/hooks/useFollowupWorksheet';
import { useWorkbookSubmissions } from '@/hooks/useOriginalSubmission';
import { FollowupForm, FollowupFormSkeleton } from './FollowupForm';
import { AlertCircle } from 'lucide-react';
import type { FollowupWorksheet } from '@/types/followup';

interface WorkbookFollowupProps {
  followupId: string;
}

// Define the API response type to match the actual structure
interface WorksheetApiResponse {
  success: boolean;
  worksheet: FollowupWorksheet;
  previousSubmission?: any;
}

export function WorkbookFollowup({ followupId }: WorkbookFollowupProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  
  // Fetch previous workbook submissions
  const {
    data: submissionsData,
    isLoading: isLoadingSubmissions,
    error: submissionsError
  } = useWorkbookSubmissions();
  
  const submissions = submissionsData?.submissions || [];
  const isLoading = isLoadingWorksheet || isLoadingSubmissions;
  const error = worksheetError || submissionsError;
  
  // Handle submission selection
  const handleSelectSubmission = async (submissionId: string) => {
    try {
      setSelectedSubmissionId(submissionId);
      setShowForm(false); // Hide form while loading
      
      // Invalidate the query cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['followupWorksheet', followupId, submissionId] });
      
      // Explicitly refetch the data with the new submissionId
      const result = await refetchWorksheet();
      console.log('Refetched worksheet data:', result.data);
      
      // Log the structure of the data to help debug
      console.log('WorkbookFollowup - Worksheet data structure:', JSON.stringify(result.data, null, 2));
      
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
        console.error('Invalid worksheet data structure:', responseData);
        alert('The follow-up worksheet data is invalid. Please try again.');
      }
    } catch (error) {
      console.error('Error selecting submission:', error);
      alert('Failed to load follow-up worksheet with the selected submission. Please try again.');
    }
  };
  
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
          You need to complete the workbook before you can do a follow-up.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {!showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Select a Previous Workbook Submission</CardTitle>
            <CardDescription>
              Choose which workbook implementation you want to follow up on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions.map((submission: any) => (
                <Card key={submission.id || submission._id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">Workbook Implementation</CardTitle>
                        <CardDescription>
                          Completed on {submission.completedAt ? new Date(submission.completedAt).toLocaleDateString() : 
                            (submission.updatedAt ? new Date(submission.updatedAt).toLocaleDateString() : 
                              new Date(submission.createdAt || Date.now()).toLocaleDateString())}
                        </CardDescription>
                      </div>
                      <Button onClick={() => handleSelectSubmission(submission.id || submission._id)}>
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
          {showForm && renderForm()}
        </div>
      )}
    </div>
  );
}
