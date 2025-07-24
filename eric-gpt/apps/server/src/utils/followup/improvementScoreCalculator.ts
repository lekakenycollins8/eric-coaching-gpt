import { IDiagnosisResult } from '@/models/WorkbookSubmission';
import { FollowupCategoryType } from '@/models/FollowupAssessment';

/**
 * Calculates an improvement score (0-100) based on the follow-up diagnosis
 * @param diagnosis The diagnosis result from the AI
 * @param followupType The type of follow-up (pillar or workbook)
 * @returns A number between 0 and 100 representing the improvement score
 */
export function calculateImprovementScore(
  diagnosis: IDiagnosisResult | undefined, 
  followupType: FollowupCategoryType
): number {
  if (!diagnosis) {
    return 0;
  }

  // Extract relevant factors from the diagnosis
  const factors: number[] = [];
  
  // Base factors from standard diagnosis fields
  if (diagnosis.strengths && diagnosis.strengths.length > 0) {
    // More strengths indicate better improvement
    factors.push(Math.min(diagnosis.strengths.length * 10, 50));
  }
  
  if (diagnosis.challenges && diagnosis.challenges.length > 0) {
    // Fewer challenges indicate better improvement
    const challengeScore = Math.max(50 - diagnosis.challenges.length * 10, 0);
    factors.push(challengeScore);
  }
  
  // Enhanced factors from detailed analysis
  if (diagnosis.situationAnalysis && 'progressLevel' in diagnosis.situationAnalysis && diagnosis.situationAnalysis.progressLevel) {
    // Direct progress level indicator if available
    factors.push(parseProgressLevel(diagnosis.situationAnalysis.progressLevel));
  }
  
  // Type-specific scoring
  if (followupType === 'pillar') {
    // For pillar follow-ups, consider pillar-specific recommendations
    if (diagnosis.pillarRecommendations && diagnosis.pillarRecommendations.length > 0) {
      // Fewer recommendations needed indicates better mastery
      const recommendationScore = Math.max(70 - diagnosis.pillarRecommendations.length * 10, 30);
      factors.push(recommendationScore);
    }
  } else {
    // For workbook follow-ups, consider implementation progress
    if (diagnosis.followupRecommendation && 
        'implementationProgress' in diagnosis.followupRecommendation && 
        diagnosis.followupRecommendation.implementationProgress) {
      factors.push(parseProgressLevel(diagnosis.followupRecommendation.implementationProgress));
    }
  }
  
  // Calculate the average score from all factors
  if (factors.length === 0) {
    return 50; // Default to neutral if no factors available
  }
  
  const averageScore = factors.reduce((sum, score) => sum + score, 0) / factors.length;
  
  // Ensure the score is between 0 and 100
  return Math.min(Math.max(Math.round(averageScore), 0), 100);
}

/**
 * Parses a textual progress level into a numeric score
 * @param progressLevel A string describing the progress level
 * @returns A number between 0 and 100
 */
function parseProgressLevel(progressLevel: string): number {
  const lowerCaseLevel = progressLevel.toLowerCase();
  
  if (lowerCaseLevel.includes('excellent') || lowerCaseLevel.includes('outstanding')) {
    return 90;
  } else if (lowerCaseLevel.includes('good') || lowerCaseLevel.includes('significant')) {
    return 75;
  } else if (lowerCaseLevel.includes('moderate') || lowerCaseLevel.includes('average')) {
    return 50;
  } else if (lowerCaseLevel.includes('limited') || lowerCaseLevel.includes('minimal')) {
    return 30;
  } else if (lowerCaseLevel.includes('poor') || lowerCaseLevel.includes('no progress')) {
    return 10;
  }
  
  // Default to middle score if no keywords match
  return 50;
}
