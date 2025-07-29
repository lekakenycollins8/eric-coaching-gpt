'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { followupApi } from '@/lib/api/followupApi';
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
  
  // Fetch previous pillar submissions
  const {
    data: submissionsData,
    isLoading: isLoadingSubmissions,
    error: submissionsError
  } = useWorksheetSubmissions(effectivePillarId);
  
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
        console.log(`PillarFollowup - Auto-selecting most recent valid submission: ${validId}`);
        handleSelectSubmission(validId);
      } else {
        console.error('PillarFollowup - No valid submission IDs found in submissions');
        setValidationError('No valid submission IDs found. Please contact support.');
      }
    }
  }, [submissions.length]);
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
    // Reset any previous validation errors
    setValidationError(null);
    
    // Validate submission ID format
    if (!submissionId || !/^[0-9a-fA-F]{24}$/.test(submissionId)) {
      console.error(`PillarFollowup - Invalid submission ID format: ${submissionId}`);
      setValidationError(`Invalid submission ID format: ${submissionId}`);
      return;
    }
    try {
      console.log(`PillarFollowup - Selecting submission: ${submissionId}`);
      setSelectedSubmissionId(submissionId);
      setShowForm(false); // Hide form while loading
      
      // First, manually fetch the data directly using the API instead of relying on React Query
      console.log(`PillarFollowup - Directly fetching worksheet: ${followupId} with submission: ${submissionId}`);
      try {
        const directResponse = await followupApi.getFollowupWorksheet(followupId || '', submissionId);
        console.log('PillarFollowup - Direct API response:', directResponse);
        
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
            console.log(`PillarFollowup - Using previousSubmission ID from API: ${directResponse.previousSubmission.id}`);
            // Update the selected submission ID to match what the server knows
            setSelectedSubmissionId(directResponse.previousSubmission.id);
          }
          
          // Now that we have valid data, show the form
          console.log('PillarFollowup - Showing form with valid worksheet from direct API call');
          setShowForm(true);
          return;
        }
      } catch (directError) {
        console.error('PillarFollowup - Error with direct API call:', directError);
        // Continue with the refetch approach as fallback
      }
      
      // If direct API call failed, try the refetch approach
      // Invalidate the query cache to ensure fresh data
      console.log(`PillarFollowup - Invalidating cache for worksheet: ${followupId} with submission: ${submissionId}`);
      await queryClient.invalidateQueries({ queryKey: ['followupWorksheet', followupId, submissionId] });
      
      // Explicitly refetch the data with the new submissionId
      console.log('PillarFollowup - Refetching worksheet data...');
      const result = await refetchWorksheet();
      
      // Log the structure of the data to help debug
      console.log('PillarFollowup - Refetched data:', result);
      console.log('PillarFollowup - Refetched data.data:', result.data);
      
      // Check if result.data is undefined before proceeding
      if (!result.data) {
        console.error('PillarFollowup - Refetched data is undefined');
        alert('Failed to load follow-up worksheet data. Please try again.');
        return;
      }
      
      // Type assertion for the result data
      const responseData = result.data as WorksheetApiResponse | undefined;
      
      // Verify we have valid data before showing the form
      if (responseData && responseData.success === true && responseData.worksheet) {
        console.log('PillarFollowup - Valid worksheet data received:', responseData.worksheet);
        
        // Additional validation for worksheet structure
        if (responseData.worksheet.id && 
            responseData.worksheet.title && 
            ((responseData.worksheet.fields && responseData.worksheet.fields.length > 0) || 
             (responseData.worksheet.sections && responseData.worksheet.sections.length > 0))) {
          
          // Check if we have a previousSubmission and use its ID if available
          if (responseData.previousSubmission && responseData.previousSubmission.id) {
            console.log(`PillarFollowup - Using previousSubmission ID from refetch: ${responseData.previousSubmission.id}`);
            // Update the selected submission ID to match what the server knows
            setSelectedSubmissionId(responseData.previousSubmission.id);
          }
          
          // Now that we have the updated data, show the form
          console.log('PillarFollowup - Showing form with valid worksheet');
          setShowForm(true);
        } else {
          console.error('PillarFollowup - Worksheet missing required fields:', responseData.worksheet);
          alert('The follow-up worksheet is missing required fields. Please try again.');
        }
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
    <div className="space-y-6">
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
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
                {submissions.map((submission: any) => {
                  const submissionId = submission.id || submission._id;
                  const isValidId = /^[0-9a-fA-F]{24}$/.test(submissionId);
                  
                  return (
                    <Button 
                      key={submissionId} 
                      variant="outline" 
                      className={`justify-start text-left font-normal ${!isValidId ? 'opacity-50' : ''}`}
                      onClick={() => handleSelectSubmission(submissionId)}
                      disabled={!isValidId}
                    >
                      <div className="flex flex-col items-start">
                        <span>{submission.title || `Submission from ${new Date(submission.createdAt).toLocaleDateString()}`}</span>
                        {!isValidId && (
                          <span className="text-xs text-destructive">Invalid ID format</span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
