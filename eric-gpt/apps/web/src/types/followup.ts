/**
 * Type definitions for the follow-up system
 */

import type { DiagnosisResult } from './diagnosis';

/**
 * Defines the two types of follow-ups in the system
 */
export type FollowupCategoryType = 'pillar' | 'workbook';

/**
 * Metadata for follow-up assessments
 */
export interface FollowupMetadata {
  pillarId?: string;
  timeElapsed: string;
  originalTitle: string;
  followupTitle: string;
  improvementScore: number;
}

/**
 * Data required for submitting a follow-up assessment
 */
export interface FollowupSubmissionData {
  followupId: string;
  originalSubmissionId: string;
  answers: Record<string, any>;
  needsHelp: boolean;
}

/**
 * Follow-up assessment data structure
 */
export interface FollowupAssessment {
  _id: string;
  userId: string;
  followupId: string;
  originalSubmissionId: string;
  followupType: FollowupCategoryType;
  answers: Record<string, any>;
  diagnosis: DiagnosisResult;
  metadata: FollowupMetadata;
  completedAt: string;
  needsHelp: boolean;
}

/**
 * Question in a follow-up worksheet section
 */
export interface FollowupQuestion {
  id: string;
  text: string;
  type: string;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
}

/**
 * Section in a follow-up worksheet
 */
export interface FollowupSection {
  title: string;
  questions: FollowupQuestion[];
}

/**
 * Follow-up worksheet structure
 */
export interface FollowupWorksheet {
  id: string;
  title: string;
  description: string;
  type: FollowupCategoryType;
  // Support both data structures
  fields?: FollowupField[];
  sections?: FollowupSection[];
  relatedPillarId?: string;
}

/**
 * Field in a follow-up worksheet
 */
export interface FollowupField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  description?: string;
}

/**
 * Follow-up recommendation structure
 */
export interface FollowupRecommendation {
  followupId: string;
  title: string;
  description: string;
  type: FollowupCategoryType;
  priority: number;
  originalSubmissionId: string;
  originalTitle: string;
  timeElapsed: string;
  pillarId?: string;
}

/**
 * Context data for follow-up assessment
 */
export interface FollowupContextData {
  originalSubmission: any;
  followupAnswers: Record<string, any>;
  followupType: FollowupCategoryType;
  pillarId?: string;
  timeElapsed?: string;
}
