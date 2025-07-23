import { FollowupType, PillarType, WorksheetType } from '../followupUtils';

/**
 * Interface for formatted question-answer pairs
 */
export interface FormattedQA {
  question: string;
  answer: string;
}

/**
 * Interface for a pillar recommendation with explanation
 */
export interface PillarRecommendation {
  id: PillarType;
  title: string;
  reason: string;
  impact: string;
  exercise: string;
}

/**
 * Interface for a follow-up worksheet recommendation with explanation
 */
export interface FollowupRecommendation {
  id: FollowupType;
  title: string;
  reason: string;
  connection: string;
  focus: string;
}

/**
 * Interface for an actionable recommendation
 */
export interface ActionableRecommendation {
  action: string;
  implementation: string;
  outcome: string;
  measurement: string;
}

/**
 * Interface for a strength with evidence and impact
 */
export interface StrengthAnalysis {
  strength: string;
  evidence: string;
  impact: string;
  leverage: string;
}

/**
 * Interface for a growth area with evidence and impact
 */
export interface GrowthAreaAnalysis {
  area: string;
  evidence: string;
  impact: string;
  rootCause: string;
}

/**
 * Interface for the enhanced parsed diagnosis response
 */
export interface DiagnosisResponse {
  // Basic fields for backward compatibility
  summary: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  followupWorksheets: {
    pillars: PillarType[];
    followup?: FollowupType;
  };
  
  // Enhanced fields for more detailed analysis
  situationAnalysis?: {
    context?: string;
    challenges?: string;
    patterns?: string;
    impact?: string;
    fullText: string;
  };
  strengthsAnalysis?: StrengthAnalysis[];
  growthAreasAnalysis?: GrowthAreaAnalysis[];
  actionableRecommendations?: ActionableRecommendation[];
  pillarRecommendations?: PillarRecommendation[];
  followupRecommendation?: FollowupRecommendation;
}

/**
 * Interface for the diagnosis result stored in the database
 * Extends DiagnosisResponse with additional metadata
 */
export interface IDiagnosisResult extends DiagnosisResponse {
  createdAt: Date;
}
