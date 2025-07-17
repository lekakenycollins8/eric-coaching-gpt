/**
 * Worksheet Utilities
 * Functions for tracking and summarizing worksheet completion
 */

import { IWorkbookSubmission, IWorksheetSubmission } from '@/models/WorkbookSubmission';
import { PILLAR_TYPES, FOLLOWUP_TYPES, PillarType, FollowupType } from './followupUtils';

/**
 * Interface for worksheet completion summary
 */
export interface WorksheetCompletionSummary {
  totalPillars: number;
  completedPillars: number;
  completedPillarIds: string[];
  hasCompletedFollowup: boolean;
  followupId: string | null;
  completedAt: Date | null;
  diagnosisGeneratedAt: Date | null;
  diagnosisViewedAt: Date | null;
}

/**
 * Get a summary of completed worksheets for a submission
 * @param submission The workbook submission
 * @returns Summary of completed worksheets
 */
export function getWorksheetCompletionSummary(
  submission: IWorkbookSubmission
): WorksheetCompletionSummary {
  // Get recommended pillar and follow-up worksheets
  const recommendedPillars = submission.diagnosis?.followupWorksheets?.pillars || [];
  const recommendedFollowup = submission.diagnosis?.followupWorksheets?.followup || null;
  
  // Get completed pillar worksheets
  const completedPillarIds = submission.pillars?.map(p => p.worksheetId) || [];
  
  // Check if follow-up worksheet is completed
  const hasCompletedFollowup = !!submission.followup;
  const followupId = submission.followup?.worksheetId || null;
  
  // Get the latest completion date
  const pillarDates = submission.pillars?.map(p => p.submittedAt) || [];
  const followupDate = submission.followup?.submittedAt || null;
  
  const allDates = [...pillarDates];
  if (followupDate) allDates.push(followupDate);
  
  const completedAt = allDates.length > 0 
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : null;
  
  return {
    totalPillars: recommendedPillars.length,
    completedPillars: completedPillarIds.length,
    completedPillarIds,
    hasCompletedFollowup,
    followupId,
    completedAt,
    diagnosisGeneratedAt: submission.diagnosisGeneratedAt || null,
    diagnosisViewedAt: submission.diagnosisViewedAt || null
  };
}

/**
 * Check if all recommended worksheets are completed
 * @param submission The workbook submission
 * @returns True if all recommended worksheets are completed
 */
export function areAllWorksheetsCompleted(submission: IWorkbookSubmission): boolean {
  const summary = getWorksheetCompletionSummary(submission);
  
  // Check if all recommended pillars are completed
  const allPillarsCompleted = summary.completedPillars >= summary.totalPillars;
  
  // Check if follow-up is completed (if recommended)
  const followupCompleted = !summary.followupId || summary.hasCompletedFollowup;
  
  return allPillarsCompleted && followupCompleted;
}

/**
 * Get the next recommended worksheet to complete
 * @param submission The workbook submission
 * @returns The ID of the next worksheet to complete, or null if all are completed
 */
export function getNextRecommendedWorksheet(submission: IWorkbookSubmission): {
  worksheetId: string | null;
  worksheetType: 'pillar' | 'followup' | null;
} {
  const summary = getWorksheetCompletionSummary(submission);
  
  // If there are uncompleted pillars, recommend the first one
  const recommendedPillars = submission.diagnosis?.followupWorksheets?.pillars || [];
  const uncompletedPillars = recommendedPillars.filter(
    p => !summary.completedPillarIds.includes(p)
  );
  
  if (uncompletedPillars.length > 0) {
    return {
      worksheetId: uncompletedPillars[0],
      worksheetType: 'pillar'
    };
  }
  
  // If all pillars are completed but follow-up is not, recommend the follow-up
  const recommendedFollowup = submission.diagnosis?.followupWorksheets?.followup;
  if (recommendedFollowup && !summary.hasCompletedFollowup) {
    return {
      worksheetId: recommendedFollowup,
      worksheetType: 'followup'
    };
  }
  
  // All worksheets are completed
  return {
    worksheetId: null,
    worksheetType: null
  };
}
