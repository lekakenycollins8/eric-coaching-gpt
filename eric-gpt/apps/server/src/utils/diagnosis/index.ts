/**
 * Diagnosis module index file
 * 
 * This file re-exports all the diagnosis-related functionality from the diagnosis folder,
 * providing a clean interface for the rest of the application.
 */

// Re-export all interfaces
export * from './interfaces';

// Re-export the diagnosis generator
export { generateAIDiagnosis, getWorksheetNameById } from './generator';

// Re-export the parser functions
export {
  parseDiagnosisResponse,
  extractListItems,
  parseSituationAnalysis,
  parseStrengthsAnalysis,
  parseGrowthAreasAnalysis,
  parseActionableRecommendations,
  parsePillarRecommendations,
  parseFollowupRecommendation,
  extractPillarIds
} from './parser';

// Re-export the recommendation functions
export {
  determineFollowupWorksheets,
  determineDefaultFollowup
} from './recommendations';
