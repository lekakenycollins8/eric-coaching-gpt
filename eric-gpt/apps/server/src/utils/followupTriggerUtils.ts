/**
 * Follow-up Worksheet Trigger Utilities
 * Functions for scheduling and triggering follow-up worksheets based on user submissions
 */

import WorkbookSubmissionModel from '@/models/WorkbookSubmission';
import { IWorkbookSubmission } from '@/models/WorkbookSubmission';

// Define a type for WorkbookSubmission document that includes both model instance and interface properties
type WorkbookSubmission = InstanceType<typeof WorkbookSubmissionModel> & IWorkbookSubmission & {
  submittedAt?: Date;
  createdAt: Date;
  _id: any;
};
import { PillarType, PILLAR_TYPES } from './followupUtils';

// Constants for trigger conditions
const LOW_RATING_THRESHOLD = 2; // Ratings <= 2 trigger follow-ups
const FOLLOW_UP_DAYS_MIN = 7; // Minimum days before suggesting a follow-up
const FOLLOW_UP_DAYS_MAX = 14; // Maximum days before suggesting a follow-up

/**
 * Interface for follow-up trigger result
 */
export interface FollowupTriggerResult {
  shouldTrigger: boolean;
  reason: string;
  worksheetId?: string;
  originalSubmissionId?: string;
  pillars?: PillarType[];
}

/**
 * Determines if a follow-up worksheet should be triggered based on time since submission
 * @param submission The original workbook submission
 * @returns Whether a follow-up should be triggered based on time
 */
export function shouldTriggerByTime(submission: WorkbookSubmission): boolean {
  // Use createdAt as the submission date if submittedAt is not available
  const submissionDate = submission.submittedAt ? new Date(submission.submittedAt) : new Date(submission.createdAt);
  const currentDate = new Date();
  const daysSinceSubmission = Math.floor(
    (currentDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceSubmission >= FOLLOW_UP_DAYS_MIN && daysSinceSubmission <= FOLLOW_UP_DAYS_MAX;
}

/**
 * Determines if a follow-up worksheet should be triggered based on low ratings
 * @param submission The original workbook submission
 * @returns Object containing whether a follow-up should be triggered and which pillar(s) had low ratings
 */
export function shouldTriggerByRatings(submission: WorkbookSubmission): { 
  shouldTrigger: boolean; 
  lowRatedPillars: string[];
} {
  const lowRatedPillars: string[] = [];
  
  // Check if answers exist
  if (!submission.answers) {
    return { shouldTrigger: false, lowRatedPillars: [] };
  }
  
  // Iterate through answers to find low ratings
  Object.entries(submission.answers).forEach(([key, value]) => {
    // Check if the field is a rating field (usually ends with _rating)
    if (key.endsWith('_rating') && typeof value === 'number' && value <= LOW_RATING_THRESHOLD) {
      // Extract pillar from the key (e.g., "pillar1_leadership_mindset_rating" -> "pillar1_leadership_mindset")
      const pillarKey = key.replace('_rating', '');
      
      // Find which pillar this belongs to
      const matchingPillar = PILLAR_TYPES.find(pillar => pillarKey.includes(pillar));
      if (matchingPillar && !lowRatedPillars.includes(matchingPillar)) {
        lowRatedPillars.push(matchingPillar);
      }
    }
  });
  
  return {
    shouldTrigger: lowRatedPillars.length > 0,
    lowRatedPillars
  };
}

/**
 * Determines if a follow-up worksheet should be triggered based on user request
 * @param submission The original workbook submission
 * @returns Whether a follow-up should be triggered based on user request
 */
export function shouldTriggerByUserRequest(submission: WorkbookSubmission): boolean {
  if (!submission.answers) return false;
  
  // Check for explicit help request fields
  const helpRequestFields = [
    'needs_help',
    'request_coaching',
    'request_followup',
    'stuck',
    'need_assistance'
  ];
  
  for (const field of helpRequestFields) {
    if (submission.answers[field] === true || submission.answers[field] === 'yes') {
      return true;
    }
  }
  
  // Check for text fields that might indicate a request for help
  const textFields = Object.entries(submission.answers)
    .filter(([key, value]) => typeof value === 'string')
    .map(([_, value]) => value as string);
  
  const helpKeywords = [
    'help me',
    'need help',
    'struggling',
    'stuck',
    'difficult',
    'challenge',
    'can\'t figure out',
    'assistance',
    'support',
    'coach',
    'guidance'
  ];
  
  for (const text of textFields) {
    const lowerText = text.toLowerCase();
    if (helpKeywords.some(keyword => lowerText.includes(keyword))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Determines which follow-up worksheet should be triggered for a given submission
 * @param submission The original workbook submission
 * @returns Object containing trigger decision and reason
 */
export function determineFollowupTrigger(submission: WorkbookSubmission): FollowupTriggerResult {
  // Check if submission already has follow-ups
  if (submission.followup || (submission.pillars && submission.pillars.length > 0)) {
    return {
      shouldTrigger: false,
      reason: 'Submission already has follow-ups'
    };
  }
  
  // Check for user request (highest priority)
  if (shouldTriggerByUserRequest(submission)) {
    // Determine which pillar to follow up on based on diagnosis
    let worksheetId = 'followup-1'; // Default follow-up
    
    if (submission.diagnosis && submission.diagnosis.followupWorksheets && 
        submission.diagnosis.followupWorksheets.pillars && 
        submission.diagnosis.followupWorksheets.pillars.length > 0) {
      // Use the first recommended pillar from the diagnosis
      const pillar = submission.diagnosis.followupWorksheets.pillars[0];
      worksheetId = `${pillar}-followup`;
    }
    
    // Extract pillars from diagnosis if available
    const pillars = (submission.diagnosis?.followupWorksheets?.pillars || []) as PillarType[];
    
    return {
      shouldTrigger: true,
      reason: 'User explicitly requested help or follow-up',
      worksheetId,
      originalSubmissionId: submission._id.toString(),
      pillars
    };
  }
  
  // Check for low ratings
  const { shouldTrigger: triggerByRatings, lowRatedPillars } = shouldTriggerByRatings(submission);
  if (triggerByRatings && lowRatedPillars.length > 0) {
    // Use the first low-rated pillar for the follow-up
    const worksheetId = `${lowRatedPillars[0]}-followup`;
    
    return {
      shouldTrigger: true,
      reason: `Low ratings detected in pillars: ${lowRatedPillars.join(', ')}`,
      worksheetId,
      originalSubmissionId: submission._id.toString(),
      pillars: lowRatedPillars as PillarType[]
    };
  }
  
  // Check for time-based trigger
  if (shouldTriggerByTime(submission)) {
    // Determine which pillar to follow up on based on diagnosis
    let worksheetId = 'followup-1'; // Default follow-up
    
    // Extract pillars from diagnosis if available
    const pillars = (submission.diagnosis?.followupWorksheets?.pillars || []) as PillarType[];
    
    if (pillars.length > 0) {
      // Use the first recommended pillar from the diagnosis
      const pillar = pillars[0];
      worksheetId = `${pillar}-followup`;
    }
    
    return {
      shouldTrigger: true,
      reason: 'Appropriate time has passed since original submission',
      worksheetId,
      originalSubmissionId: submission._id.toString(),
      pillars
    };
  }
  
  // No trigger conditions met
  return {
    shouldTrigger: false,
    reason: 'No trigger conditions met'
  };
}

/**
 * Gets all submissions that should have follow-ups triggered
 * @param submissions Array of workbook submissions to check
 * @returns Array of trigger results for submissions that should have follow-ups, sorted by priority
 */
export function getTriggeredFollowups(submissions: WorkbookSubmission[]): FollowupTriggerResult[] {
  // Process each submission to determine triggers
  const results = submissions
    .map(submission => determineFollowupTrigger(submission))
    .filter(result => result.shouldTrigger);
  
  // Sort by priority (explicit requests first, then low ratings, then time-based)
  return results.sort((a, b) => {
    // Helper function to determine priority score (higher = more important)
    const getPriorityScore = (result: FollowupTriggerResult): number => {
      if (result.reason.includes('explicitly requested')) return 3;
      if (result.reason.includes('Low ratings')) return 2;
      if (result.reason.includes('time')) return 1;
      return 0;
    };
    
    return getPriorityScore(b) - getPriorityScore(a);
  });
}
