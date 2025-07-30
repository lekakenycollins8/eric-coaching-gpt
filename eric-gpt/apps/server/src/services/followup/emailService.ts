import { sendFollowupCompletionEmail } from '@/utils/followup/emailNotifier';
import { FollowupCategoryType } from '@/utils/followupUtils';

/**
 * Sends a notification email about the follow-up submission
 * Handles different email templates based on follow-up type
 */
export async function sendNotificationEmail(
  user: any,
  originalSubmission: any,
  followupAssessment: any,
  needsHelp: boolean,
  followupType: FollowupCategoryType
) {
  try {
    if (!followupAssessment) {
      console.warn('Skipping email notification as followupAssessment was not created');
      return { success: false, error: 'No followupAssessment provided' };
    }
    
    await sendFollowupCompletionEmail(
      user,
      originalSubmission,
      followupAssessment,
      needsHelp,
      followupType
    );
    
    console.log(`${followupType.charAt(0).toUpperCase() + followupType.slice(1)} follow-up submission notification email sent successfully`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending notification email:', error);
    return { success: false, error };
  }
}
