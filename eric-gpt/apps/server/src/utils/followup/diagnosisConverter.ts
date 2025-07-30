import { 
  IDiagnosisResult, 
  IFollowupWorksheets,
  ISituationAnalysis,
  IStrengthAnalysis,
  IGrowthAreaAnalysis,
  IActionableRecommendation,
  IPillarRecommendation,
  IFollowupRecommendation
} from '@/models/WorkbookSubmission';
import { FollowupDiagnosisResponse } from '@/utils/diagnosis/followupDiagnosis';
import { FollowupCategoryType } from '@/utils/followupUtils';

/**
 * Convert a diagnosis response from the AI to the database model format
 * @param diagnosisResponse The diagnosis response from the AI
 * @param followupType The type of follow-up ('pillar' or 'workbook')
 * @returns The diagnosis result in database model format
 */
export function convertToDatabaseFormat(
  diagnosisResponse: FollowupDiagnosisResponse,
  followupType: FollowupCategoryType
): IDiagnosisResult {
  // Create the follow-up worksheets object
  const followupWorksheets: IFollowupWorksheets = {
    pillars: getRecommendedPillars(diagnosisResponse, followupType),
    followup: 'followup-assessment' // Default follow-up worksheet ID
  };
  
  // Ensure all required fields have valid values to prevent validation errors
  const situationAnalysisText = diagnosisResponse.situationAnalysis || '';
  const strengthsAnalysisText = diagnosisResponse.strengthsAnalysis || '';
  const growthAreasAnalysisText = diagnosisResponse.growthAreasAnalysis || '';
  const actionableRecommendationsText = diagnosisResponse.actionableRecommendations || '';
  
  // Create the diagnosis result object
  return {
    summary: diagnosisResponse.summary || '',
    strengths: [strengthsAnalysisText],
    challenges: [growthAreasAnalysisText],
    recommendations: [actionableRecommendationsText],
    followupWorksheets,
    createdAt: new Date(),
    
    // Enhanced diagnosis fields - ensure all are properly initialized
    situationAnalysis: createSituationAnalysis(situationAnalysisText),
    strengthsAnalysis: createStrengthsAnalysis(strengthsAnalysisText),
    growthAreasAnalysis: createGrowthAreasAnalysis(growthAreasAnalysisText),
    actionableRecommendations: createActionableRecommendations(actionableRecommendationsText),
    pillarRecommendations: createPillarRecommendations(diagnosisResponse.pillarRecommendations),
    followupRecommendation: createFollowupRecommendation(diagnosisResponse.followupRecommendation || '')
  };
}

/**
 * Extract recommended pillar IDs from the diagnosis response
 * @param diagnosisResponse The diagnosis response from the AI
 * @param followupType The type of follow-up ('pillar' or 'workbook')
 * @returns Array of recommended pillar IDs
 */
function getRecommendedPillars(
  diagnosisResponse: FollowupDiagnosisResponse,
  followupType: FollowupCategoryType
): string[] {
  // For now, return an empty array
  // In a future enhancement, we could parse the pillar recommendations
  // to extract specific pillar IDs
  return [];
}

/**
 * Create a situation analysis object from a string
 * @param situationAnalysis The situation analysis text
 * @returns The situation analysis object
 */
function createSituationAnalysis(situationAnalysis: string): ISituationAnalysis {
  // Ensure we always have a valid string for fullText to satisfy schema validation
  return {
    fullText: situationAnalysis || '',
    // In a future enhancement, we could parse the text to extract
    // context, challenges, patterns, and impact
  };
}

/**
 * Create a strengths analysis array from a string
 * @param strengthsAnalysis The strengths analysis text
 * @returns The strengths analysis array
 */
function createStrengthsAnalysis(strengthsAnalysis: string): IStrengthAnalysis[] | undefined {
  if (!strengthsAnalysis) return [];
  
  return [{
    strength: strengthsAnalysis,
    evidence: '',
    impact: '',
    leverage: ''
  }];
  
  // In a future enhancement, we could parse the text to extract
  // multiple strengths with evidence, impact, and leverage
}

/**
 * Create a growth areas analysis array from a string
 * @param growthAreasAnalysis The growth areas analysis text
 * @returns The growth areas analysis array
 */
function createGrowthAreasAnalysis(growthAreasAnalysis: string): IGrowthAreaAnalysis[] | undefined {
  if (!growthAreasAnalysis) return [];
  
  return [{
    area: growthAreasAnalysis,
    evidence: '',
    impact: '',
    rootCause: ''
  }];
  
  // In a future enhancement, we could parse the text to extract
  // multiple growth areas with evidence, impact, and root cause
}

/**
 * Create an actionable recommendations array from a string
 * @param actionableRecommendations The actionable recommendations text
 * @returns The actionable recommendations array
 */
function createActionableRecommendations(actionableRecommendations: string): IActionableRecommendation[] | undefined {
  if (!actionableRecommendations) return [];
  
  return [{
    action: actionableRecommendations,
    implementation: '',
    outcome: '',
    measurement: ''
  }];
  
  // In a future enhancement, we could parse the text to extract
  // multiple recommendations with implementation, outcome, and measurement
}

/**
 * Create a pillar recommendations array from a string
 * @param pillarRecommendations The pillar recommendations text
 * @returns The pillar recommendations array
 */
function createPillarRecommendations(pillarRecommendations?: string): IPillarRecommendation[] | undefined {
  if (!pillarRecommendations) return [];
  
  return [{
    id: '',
    title: '',
    reason: pillarRecommendations,
    impact: '',
    exercise: ''
  }];
  
  // In a future enhancement, we could parse the text to extract
  // multiple pillar recommendations with id, title, reason, impact, and exercise
}

/**
 * Create a follow-up recommendation object from a string
 * @param followupRecommendation The follow-up recommendation text
 * @returns The follow-up recommendation object
 */
function createFollowupRecommendation(followupRecommendation: string): IFollowupRecommendation | undefined {
  if (!followupRecommendation) {
    // Return a default object instead of undefined to avoid validation errors
    return {
      id: 'followup-assessment',
      title: 'Follow-up Assessment',
      reason: '',
      connection: '',
      focus: ''
    };
  }
  
  return {
    id: 'followup-assessment',
    title: 'Follow-up Assessment',
    reason: followupRecommendation,
    connection: '',
    focus: ''
  };
  
  // In a future enhancement, we could parse the text to extract
  // connection and focus
}
