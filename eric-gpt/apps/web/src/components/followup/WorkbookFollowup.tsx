'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  const [validationError, setValidationError] = useState<string | null>(null);
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
  
  // Auto-select the most recent valid submission when submissions are loaded
  useEffect(() => {
    if (submissions.length > 0 && !selectedSubmissionId) {
      // Sort submissions by date (newest first)
      const sortedSubmissions = [...submissions].sort((a, b) => {
        const dateA = a.completedAt || a.updatedAt || a.createdAt || 0;
        const dateB = b.completedAt || b.updatedAt || b.createdAt || 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      
      // Find the first submission with a valid MongoDB ObjectId
      const validSubmission = sortedSubmissions.find(submission => {
        const id = submission.id || submission._id;
        return id && /^[0-9a-fA-F]{24}$/.test(id);
      });
      
      if (validSubmission) {
        const validId = validSubmission.id || validSubmission._id;
        console.log(`WorkbookFollowup - Auto-selecting most recent valid submission: ${validId}`);
        handleSelectSubmission(validId);
      } else {
        console.error('WorkbookFollowup - No valid submission IDs found in submissions');
        setValidationError('No valid submission IDs found. Please contact support.');
      }
    }
  }, [submissions.length]);
  const isLoading = isLoadingWorksheet || isLoadingSubmissions;
  const error = worksheetError || submissionsError;
  
  // Handle submission selection
  const handleSelectSubmission = async (submissionId: string) => {
    // Reset any previous validation errors
    setValidationError(null);
    
    // Validate submission ID format
    if (!submissionId || !/^[0-9a-fA-F]{24}$/.test(submissionId)) {
      console.error(`WorkbookFollowup - Invalid submission ID format: ${submissionId}`);
      setValidationError(`Invalid submission ID format: ${submissionId}`);
      return;
    }
    try {
      console.log(`WorkbookFollowup - Selecting submission: ${submissionId}`);
      setSelectedSubmissionId(submissionId);
      setShowForm(false); // Hide form while loading
      
      // First, manually fetch the data directly using the API instead of relying on React Query
      console.log(`WorkbookFollowup - Directly fetching worksheet: ${followupId} with submission: ${submissionId}`);
      try {
        const directResponse = await followupApi.getFollowupWorksheet(followupId || '', submissionId);
        console.log('WorkbookFollowup - Direct API response:', directResponse);
        
        // Verify we have valid data from direct API call
        if (directResponse && 
            directResponse.success === true && 
            directResponse.worksheet && 
            directResponse.worksheet.id && 
            directResponse.worksheet.title) {
          
          // Update the cache with this data
          queryClient.setQueryData(['followupWorksheet', followupId, submissionId], directResponse);
          
          // Check if we have a previousSubmission and use its ID if available
          if (directResponse.previousSubmission && directResponse.previousSubmission.id) {
            console.log(`WorkbookFollowup - Using previousSubmission ID from API: ${directResponse.previousSubmission.id}`);
            // Update the selected submission ID to match what the server knows
            setSelectedSubmissionId(directResponse.previousSubmission.id);
          } else {
            console.log(`WorkbookFollowup - No previousSubmission in API response, using original ID: ${submissionId}`);
            // Keep using the original submission ID since no alternative was provided
          }
          
          // Verify we have a valid submission ID before showing the form
          if (directResponse.previousSubmission === null && !submissionId) {
            console.error('WorkbookFollowup - No valid submission ID available');
            alert('Could not find a valid submission to associate with this follow-up. Please try again.');
            return;
          }
          
          // Now that we have valid data, show the form
          console.log('WorkbookFollowup - Showing form with valid worksheet from direct API call');
          setShowForm(true);
          return;
        }
      } catch (directError) {
        console.error('WorkbookFollowup - Error with direct API call:', directError);
        // Continue with the refetch approach as fallback
      }
      
      // If direct API call failed, try the refetch approach
      // Invalidate the query cache to ensure fresh data
      console.log(`WorkbookFollowup - Invalidating cache for worksheet: ${followupId} with submission: ${submissionId}`);
      await queryClient.invalidateQueries({ queryKey: ['followupWorksheet', followupId, submissionId] });
      
      // Explicitly refetch the data with the new submissionId
      console.log('WorkbookFollowup - Refetching worksheet data...');
      const result = await refetchWorksheet();
      
      // Log the structure of the data to help debug
      console.log('WorkbookFollowup - Refetched data:', result);
      console.log('WorkbookFollowup - Refetched data.data:', result.data);
      
      // Check if result.data is undefined before proceeding
      if (!result.data) {
        console.error('WorkbookFollowup - Refetched data is undefined');
        alert('Failed to load follow-up worksheet data. Please try again.');
        return;
      }
      
      // Type assertion for the result data
      const responseData = result.data as WorksheetApiResponse | undefined;
      
      // Verify we have valid data before showing the form
      if (responseData && responseData.success === true && responseData.worksheet) {
        console.log('WorkbookFollowup - Valid worksheet data received:', responseData.worksheet);
        
        // Additional validation for worksheet structure
        if (responseData.worksheet.id && 
            responseData.worksheet.title && 
            ((responseData.worksheet.fields && responseData.worksheet.fields.length > 0) || 
             (responseData.worksheet.sections && responseData.worksheet.sections.length > 0))) {
          // Check if we have a previousSubmission and use its ID if available
          if (responseData.previousSubmission && responseData.previousSubmission.id) {
            console.log(`WorkbookFollowup - Using previousSubmission ID from refetch: ${responseData.previousSubmission.id}`);
            // Update the selected submission ID to match what the server knows
            setSelectedSubmissionId(responseData.previousSubmission.id);
          } else {
            console.log(`WorkbookFollowup - No previousSubmission in refetch response, using original ID: ${submissionId}`);
            // Keep using the original submission ID since no alternative was provided
          }
          
          // Verify we have a valid submission ID before showing the form
          if (responseData.previousSubmission === null && !submissionId) {
            console.error('WorkbookFollowup - No valid submission ID available');
            alert('Could not find a valid submission to associate with this follow-up. Please try again.');
            return;
          }
          
          // Now that we have the updated data, show the form
          console.log('WorkbookFollowup - Showing form with valid worksheet');
          setShowForm(true);
        } else {
          console.error('WorkbookFollowup - Worksheet missing required fields:', responseData.worksheet);
          alert('The follow-up worksheet is missing required fields. Please try again.');
        }
      } else {
        console.error('WorkbookFollowup - Invalid worksheet data structure:', responseData);
        alert('The follow-up worksheet data is invalid. Please try again.');
      }
    } catch (error) {
      console.error('WorkbookFollowup - Error selecting submission:', error);
      alert('Failed to load follow-up worksheet. Please try again.');
    }
  };
  
  // Render the follow-up form when data is ready
  const renderForm = () => {
    if (!typedResponse?.success || !typedResponse?.worksheet) {
      console.log('Cannot render form - missing worksheet data:', typedResponse);
      return null;
    }
    
    // Ensure we have a valid submission ID
    if (!selectedSubmissionId) {
      console.error('Cannot render form - missing submission ID');
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Submission ID</AlertTitle>
          <AlertDescription>
            Could not find a valid submission to associate with this follow-up. Please try selecting a different submission.
          </AlertDescription>
        </Alert>
      );
    }
    
    console.log('Rendering form with worksheet');
    console.log('Using submission ID:', selectedSubmissionId);
    
    return (
      <FollowupForm 
        worksheet={typedResponse.worksheet} 
        originalSubmissionId={selectedSubmissionId} 
        onSuccess={handleSuccess}
      />
    );
  };
  
  // Handle successful submission
  const handleSuccess = (data: any) => {
    // Redirect to the diagnosis page for this workbook follow-up
    router.push(`/dashboard/followup/workbook/diagnosis`);
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
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
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
              {submissions.map((submission: any) => {
                const submissionId = submission.id || submission._id;
                const isValidId = /^[0-9a-fA-F]{24}$/.test(submissionId);
                
                return (
                  <Card 
                    key={submissionId} 
                    className={`cursor-pointer transition-colors ${isValidId ? 'hover:bg-accent/50' : 'opacity-50'}`}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base">Workbook Implementation</CardTitle>
                          <CardDescription>
                            Completed on {submission.completedAt ? new Date(submission.completedAt).toLocaleDateString() : 
                              (submission.updatedAt ? new Date(submission.updatedAt).toLocaleDateString() : 
                                new Date(submission.createdAt || Date.now()).toLocaleDateString())}
                          </CardDescription>
                          {!isValidId && (
                            <p className="text-xs text-destructive mt-1">Invalid submission ID format</p>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleSelectSubmission(submissionId)}
                          disabled={!isValidId}
                        >
                          Select
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
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
