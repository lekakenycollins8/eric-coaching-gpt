import { FollowupCategoryType } from '@/utils/followupUtils';

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
export function buildFollowupContext(
  followupType: FollowupCategoryType,
  originalSubmission: any,
  followupAnswers: Record<string, any>,
  pillarId?: string,
  timeElapsed?: string
): FollowupContextData {
  // Get the user name from the original submission
  const userName = originalSubmission.userName || 
                   (originalSubmission.user?.name) || 
                   (originalSubmission.userId ? 'User ' + originalSubmission.userId.toString() : 'Client');
  
  // Get the original diagnosis
  const originalDiagnosis = originalSubmission.diagnosis || {};
  
  // Get the original answers
  const originalAnswers = originalSubmission.answers || {};
  
  // Get worksheet title and description
  const worksheetTitle = followupType === 'pillar' ? 
    `Pillar Follow-up: ${getPillarTitle(pillarId)}` : 
    'Workbook Implementation Follow-up';
  
  const worksheetDescription = followupType === 'pillar' ? 
    `Follow-up assessment for the ${getPillarTitle(pillarId)} pillar` : 
    'Follow-up assessment for overall workbook implementation';
  
  return {
    originalAnswers,
    followupAnswers,
    originalDiagnosis,
    worksheetTitle,
    worksheetDescription,
    timeElapsed: timeElapsed || 'Unknown',
    pillarId,
    pillarTitle: getPillarTitle(pillarId),
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
    'leadership-mindset': 'Leadership Mindset',
    'goal-setting': 'Goal Setting',
    'communication-mastery': 'Communication Mastery',
    'team-building': 'Team Building',
    'decision-making': 'Decision Making',
    'emotional-intelligence': 'Emotional Intelligence',
    'conflict-resolution': 'Conflict Resolution',
    'time-management': 'Time Management',
    'delegation': 'Delegation',
    'coaching-mentoring': 'Coaching and Mentoring',
    'change-management': 'Change Management',
    'strategic-thinking': 'Strategic Thinking'
  };
  
  return pillarTitles[pillarId] || 'Unknown Pillar';
}
