/**
 * API client for follow-up operations
 * Provides a clean interface for interacting with the server
 */

import type { 
  FollowupSubmissionData, 
  FollowupCategoryType, 
  FollowupAssessment,
  FollowupRecommendation,
  FollowupWorksheet,
  FollowupContextData
} from '@/types/followup';

/**
 * Follow-up API client
 */
export const followupApi = {
  /**
   * Get diagnosis data for a pillar follow-up
   * @param followupId The ID of the follow-up (pillar ID)
   * @returns The diagnosis data
   */
  async getFollowupDiagnosis(followupId: string) {
    try {
      // Use the correct API endpoint for pillar diagnosis
      const response = await fetch(`/api/followup/diagnosis/${followupId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch follow-up diagnosis: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching follow-up diagnosis:', error);
      throw error;
    }
  },
  
  /**
   * Get diagnosis data for a workbook follow-up
   * @returns The workbook diagnosis data
   */
  async getWorkbookFollowupDiagnosis() {
    try {
      const response = await fetch('/api/followup/diagnosis/workbook');
      if (!response.ok) {
        throw new Error(`Failed to fetch workbook follow-up diagnosis: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching workbook follow-up diagnosis:', error);
      throw error;
    }
  },
  
  /**
   * Submit a follow-up assessment
   * @param data The follow-up submission data
   * @returns The created follow-up assessment
   */
  async submitFollowup(data: FollowupSubmissionData): Promise<FollowupAssessment> {
    // Validate the submission ID format before sending to server
    if (data.originalSubmissionId) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(data.originalSubmissionId);
      if (!isValidObjectId) {
        console.error(`Invalid submission ID format: ${data.originalSubmissionId}`);
        throw new Error(`Invalid submission ID format: ${data.originalSubmissionId}. Please select a valid submission.`);
      }
      console.log(`Submitting follow-up with original submission ID: ${data.originalSubmissionId}`);
    } else {
      console.error('No original submission ID provided');
      throw new Error('No original submission ID provided. Please select a submission before continuing.');
    }
    
    try {
      const response = await fetch('/api/followup/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        // Try to parse error message if available
        try {
          const error = await response.json();
          
          // Check if the server provided recent submission IDs as alternatives
          if (error.recentSubmissionIds && Array.isArray(error.recentSubmissionIds) && error.recentSubmissionIds.length > 0) {
            console.log('Server provided alternative submission IDs:', error.recentSubmissionIds);
            throw new Error(`${error.message || error.error || 'Failed to submit follow-up'}. The server suggests using one of these recent submissions instead.`);
          } else {
            throw new Error(error.message || error.error || `Failed to submit follow-up: ${response.status}`);
          }
        } catch (e) {
          if (e instanceof Error) {
            throw e; // Re-throw the parsed error
          } else {
            throw new Error(`Failed to submit follow-up: ${response.status}`);
          }
        }
      }
      
      const result = await response.json();
      console.log('Follow-up submission successful:', result);
      return result;
    } catch (error) {
      console.error('Error in submitFollowup:', error);
      throw error;
    }
  },
  
  /**
   * Get follow-up recommendations for the current user
   * @returns List of follow-up recommendations
   */
  async getRecommendations(): Promise<{ recommendations: FollowupRecommendation[] }> {
    const response = await fetch('/api/followup/recommendations');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch follow-up recommendations: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Get a follow-up worksheet by ID
   * @param id The ID of the follow-up worksheet to retrieve
   * @param submissionId Optional ID of a previous submission to provide context
   * @returns The follow-up worksheet data
   */
  async getFollowupWorksheet(id: string, submissionId?: string): Promise<any> {
    try {
      // Build the URL with optional submission ID parameter
      let url = `/api/followup/worksheets/${id}`;
      if (submissionId) {
        // Validate submission ID format
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(submissionId);
        if (!isValidObjectId) {
          console.warn(`Invalid submission ID format: ${submissionId}. Using without ID.`);
        } else {
          url += `?submissionId=${submissionId}`;
        }
      }
      
      console.log(`Fetching follow-up worksheet: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching follow-up worksheet: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch follow-up worksheet: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Enhanced logging for debugging
      console.log('Follow-up worksheet data:', {
        success: data?.success,
        worksheetId: data?.worksheet?.id,
        worksheetTitle: data?.worksheet?.title,
        hasPreviousSubmission: !!data?.previousSubmission,
        previousSubmissionId: data?.previousSubmission?.id || 'none',
        requestedSubmissionId: submissionId || 'none'
      });
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        console.error('Invalid API response format:', data);
        throw new Error('Invalid API response format');
      }
      
      // Return the complete API response
      return data;
    } catch (error) {
      console.error('Error in getFollowupWorksheet:', error);
      throw error;
    }
  },
  
  /**
   * Get all available follow-up worksheets
   * @param type Optional type filter (pillar or workbook)
   * @returns List of follow-up worksheets
   */
  async getAllFollowupWorksheets(type?: FollowupCategoryType): Promise<{ worksheets: FollowupWorksheet[] }> {
    const url = type 
      ? `/api/followup/worksheets?type=${type}` 
      : '/api/followup/worksheets';
      
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch follow-up worksheets: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Get a follow-up worksheet based on a previous submission
   * @param submissionId The original submission ID
   * @returns The follow-up worksheet
   */
  async getFollowupBySubmission(submissionId: string): Promise<{ worksheet: FollowupWorksheet }> {
    const response = await fetch(`/api/followup?submissionId=${submissionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch follow-up worksheet: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Get previous workbook submissions for the current user
   * @returns List of workbook submissions
   */
  async getWorkbookSubmissions(): Promise<{ submissions: any[] }> {
    const response = await fetch('/api/workbook/submission');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch workbook submissions: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Get previous worksheet submissions for the current user
   * @param pillarId Optional pillar ID to filter by
   * @returns List of worksheet submissions
   */
  async getWorksheetSubmissions(pillarId?: string): Promise<{ submissions: any[] }> {
    const url = pillarId 
      ? `/api/worksheet/submissions?pillarId=${pillarId}` 
      : '/api/worksheet/submissions';
      
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch worksheet submissions: ${response.status}`);
    }
    
    return response.json();
  }
};
