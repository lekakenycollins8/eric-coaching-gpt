import { emailService } from '@/services/emailService';
import { FollowupCategoryType } from '@/utils/followupUtils';
import { FollowupDiagnosisResponse } from '@/utils/diagnosis/followupDiagnosis';
import { IUser } from '@/models/User';
import { IWorkbookSubmission } from '@/models/WorkbookSubmission';
import { IFollowupAssessment } from '@/models/FollowupAssessment';
import { Document } from 'mongoose';

/**
 * Send a follow-up completion email notification
 * @param user The user who submitted the follow-up
 * @param originalSubmission The original workbook submission
 * @param followupAssessment The follow-up assessment submission
 * @param needsHelp Whether the user needs help (optional)
 * @param followupType The type of follow-up (pillar or workbook)
 */
export async function sendFollowupCompletionEmail(
  user: IUser & Document,
  originalSubmission: IWorkbookSubmission & Document,
  followupAssessment: IFollowupAssessment & Document,
  needsHelp: boolean = false,
  followupType: FollowupCategoryType = 'pillar'
): Promise<boolean> {
  try {
    // Use the existing emailService method which already handles different follow-up types
    return await emailService.sendFollowupSubmissionNotification(
      user,
      originalSubmission,
      followupAssessment,
      needsHelp,
      followupType
    );
  } catch (error) {
    console.error('Error sending follow-up completion email:', error);
    return false;
  }
}

/**
 * Format diagnosis content for email based on follow-up type
 * @param diagnosis The diagnosis response
 * @param followupType The type of follow-up
 * @returns Formatted diagnosis content for email
 */
function formatDiagnosisForEmail(
  diagnosis: FollowupDiagnosisResponse,
  followupType: FollowupCategoryType
): Record<string, string> {
  // Common sections for both follow-up types
  const formattedDiagnosis: Record<string, string> = {
    summary: diagnosis.summary,
    actionableRecommendations: diagnosis.actionableRecommendations,
    followupRecommendation: diagnosis.followupRecommendation
  };
  
  // Add type-specific sections
  if (followupType === 'pillar') {
    formattedDiagnosis.progressAnalysis = diagnosis.situationAnalysis;
    formattedDiagnosis.implementationEffectiveness = diagnosis.strengthsAnalysis;
    formattedDiagnosis.adjustedRecommendations = diagnosis.growthAreasAnalysis;
    formattedDiagnosis.continuedGrowthPlan = diagnosis.actionableRecommendations;
  } else {
    formattedDiagnosis.implementationProgressAnalysis = diagnosis.situationAnalysis;
    formattedDiagnosis.crossPillarIntegration = diagnosis.strengthsAnalysis;
    formattedDiagnosis.implementationBarriers = diagnosis.growthAreasAnalysis;
    formattedDiagnosis.comprehensiveAdjustmentPlan = diagnosis.actionableRecommendations;
    formattedDiagnosis.nextFocusAreas = diagnosis.pillarRecommendations || '';
  }
  
  return formattedDiagnosis;
}
