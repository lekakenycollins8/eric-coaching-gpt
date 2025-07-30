import { FollowupCategoryType } from '@/utils/followupUtils';
import UserModel from '@/models/User';

/**
 * Interface for the context data needed for follow-up diagnosis
 */
export interface FollowupContextData {
  originalAnswers: Record<string, any>;
  followupAnswers: Record<string, any>;
  originalDiagnosis: any;
  worksheetTitle: string;
  worksheetDescription: string;
  timeElapsed: string;
  pillarId?: string;
  pillarTitle?: string;
  userName?: string;
  needsPillarSubmissionLookup?: boolean; // Flag indicating if we need to look up a separate pillar submission
}

/**
 * Build context data for follow-up diagnosis from submission data
 * @param followupType The type of follow-up ('pillar' or 'workbook')
 * @param originalSubmission The original workbook submission
 * @param followupAnswers The follow-up answers
 * @param pillarId Optional pillar ID for pillar follow-ups
 * @param timeElapsed Time elapsed since original submission
 * @returns Context data for follow-up diagnosis
 */
export async function buildFollowupContext(
  followupType: FollowupCategoryType,
  originalSubmission: any,
  followupAnswers: Record<string, any>,
  pillarId?: string,
  timeElapsed?: string
): Promise<FollowupContextData> {
  // Get the user name from the database if possible
  let userName = 'Client';
  
  if (originalSubmission.userId) {
    try {
      // Try to get the user's full name from the database
      const userId = originalSubmission.userId.toString();
      const user = await UserModel.findById(userId);
      
      if (user) {
        userName = user.name || 'Client';
        console.log(`Found user name from database: ${userName}`);
      } else {
        console.log(`User not found in database for ID: ${userId}`);
        // Fall back to any name available in the submission
        userName = originalSubmission.userName || 
                  (originalSubmission.user?.name) || 
                  'Client';
      }
    } catch (error) {
      console.error('Error fetching user name from database:', error);
      // Fall back to any name available in the submission
      userName = originalSubmission.userName || 
                (originalSubmission.user?.name) || 
                'Client';
    }
  } else {
    // Fall back to any name available in the submission
    userName = originalSubmission.userName || 
              (originalSubmission.user?.name) || 
              'Client';
  }
  
  // Get the original diagnosis
  const originalDiagnosis = originalSubmission.diagnosis || {};
  
  // Get the original answers
  const originalAnswers = originalSubmission.answers || {};
  
  // Get pillar title with better error handling
  const pillarTitle = getPillarTitle(pillarId);
  console.log(`Using pillar title: ${pillarTitle} for pillar ID: ${pillarId || 'none'}`);
  
  // Get worksheet title and description
  const worksheetTitle = followupType === 'pillar' ? 
    `Pillar Follow-up: ${pillarTitle}` : 
    'Workbook Implementation Follow-up';
  
  const worksheetDescription = followupType === 'pillar' ? 
    `Follow-up assessment for the ${pillarTitle} pillar` : 
    'Follow-up assessment for overall workbook implementation';
  
  return {
    originalAnswers,
    followupAnswers,
    originalDiagnosis,
    worksheetTitle,
    worksheetDescription,
    timeElapsed: timeElapsed || 'Unknown',
    pillarId,
    pillarTitle,
    userName
  };
}

/**
 * Get the title of a pillar based on its ID
 * @param pillarId The pillar ID
 * @returns The pillar title
 */
function getPillarTitle(pillarId?: string): string {
  if (!pillarId) return 'Unknown Pillar';
  
  // Map of pillar IDs to titles
  const pillarTitles: Record<string, string> = {
    
    // Add mappings for the actual pillar IDs used in the database
    'pillar1_leadership_mindset': 'Leadership Mindset',
    'pillar2_goal_setting': 'Goal Setting',
    'pillar3_communication_mastery': 'Communication Mastery',
    'pillar4_team_building': 'Team Building',
    'pillar5_decision_making': 'Decision Making',
    'pillar6_emotional_intelligence': 'Emotional Intelligence',
    'pillar7_conflict_resolution': 'Conflict Resolution',
    'pillar8_time_management': 'Time Management',
    'pillar9_delegation': 'Delegation',
    'pillar10_coaching_mentoring': 'Coaching and Mentoring',
    'pillar11_change_management': 'Change Management',
    'pillar12_strategic_thinking': 'Strategic Thinking'
  };
  
  // Try to match by exact ID first
  if (pillarTitles[pillarId]) {
    return pillarTitles[pillarId];
  }
  
  // If not found, try to extract the pillar number and match by pattern
  const pillarMatch = pillarId.match(/pillar(\d+)/i);
  if (pillarMatch && pillarMatch[1]) {
    const pillarNum = parseInt(pillarMatch[1]);
    switch (pillarNum) {
      case 1: return 'Leadership Mindset';
      case 2: return 'Goal Setting';
      case 3: return 'Communication Mastery';
      case 4: return 'Team Building';
      case 5: return 'Decision Making';
      case 6: return 'Emotional Intelligence';
      case 7: return 'Conflict Resolution';
      case 8: return 'Time Management';
      case 9: return 'Delegation';
      case 10: return 'Coaching and Mentoring';
      case 11: return 'Change Management';
      case 12: return 'Strategic Thinking';
    }
  }
  
  return 'Unknown Pillar';
}
