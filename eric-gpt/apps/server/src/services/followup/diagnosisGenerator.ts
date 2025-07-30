import { generateFollowupDiagnosis } from '@/utils/diagnosis/followupDiagnosis';
import { convertToDatabaseFormat } from '@/utils/followup/diagnosisConverter';
import { FollowupCategoryType } from '@/utils/followupUtils';

/**
 * Generates and formats a follow-up diagnosis
 * Uses the appropriate prompt based on follow-up type
 */
export async function generateAndFormatDiagnosis(followupType: FollowupCategoryType, contextData: any) {
  try {
    console.log(`Generating enhanced AI diagnosis for ${followupType} follow-up submission`);
    
    // Generate the follow-up diagnosis with the appropriate prompt based on follow-up type
    const diagnosisResponse = await generateFollowupDiagnosis(followupType, contextData);
    
    console.log(`Generated ${followupType} follow-up diagnosis`);
    
    // Convert the diagnosis response to the database format using our converter utility
    const rawDiagnosisResponse = convertToDatabaseFormat(diagnosisResponse, followupType);
    
    console.log('Enhanced AI diagnosis generated successfully');
    
    return {
      success: true,
      diagnosisResponse,
      rawDiagnosisResponse
    };
  } catch (error) {
    console.error('Error generating diagnosis:', error);
    return {
      success: false,
      error
    };
  }
}
