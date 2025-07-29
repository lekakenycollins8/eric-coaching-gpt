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
   * Submit a follow-up assessment
   * @param data The follow-up submission data
   * @returns The created follow-up assessment
   */
  async submitFollowup(data: FollowupSubmissionData): Promise<FollowupAssessment> {
    const response = await fetch('/api/followup/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      // Try to parse error message if available
      try {
        const error = await response.json();
        throw new Error(error.message || error.error || `Failed to submit follow-up: ${response.status}`);
      } catch (e) {
        throw new Error(`Failed to submit follow-up: ${response.status}`);
      }
    }
    
    return response.json();
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
   * @param followupId The follow-up worksheet ID
   * @param submissionId Optional ID of a previous submission to provide context
   * @returns API response containing the worksheet and optional previous submission
   */
  async getFollowupWorksheet(followupId: string, submissionId?: string): Promise<{ 
    success: boolean; 
    worksheet: FollowupWorksheet; 
    previousSubmission?: any 
  }> {
    const url = submissionId
      ? `/api/followup/worksheets/${followupId}?submissionId=${submissionId}`
      : `/api/followup/worksheets/${followupId}`;
    
    console.log(`Fetching follow-up worksheet from URL: ${url}`);
    
    try {  
      const response = await fetch(url);
      
      if (!response.ok) {
        // Try to parse error message if available
        try {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          throw new Error(errorData.message || errorData.error || `Failed to fetch follow-up worksheet: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Failed to fetch follow-up worksheet: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      // Validate the response structure
      if (!data.success || !data.worksheet) {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid response structure: missing worksheet data');
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
