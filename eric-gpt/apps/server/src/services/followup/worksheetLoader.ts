import { loadFollowupById, validateFollowupAnswers, getFollowupType, extractPillarId } from '@/utils/followupUtils';
import { parseFormattedAnswers } from '@/utils/followup/answerFormatter';

/**
 * Loads and validates a follow-up worksheet
 * Determines the follow-up type and extracts pillar ID if applicable
 */
export async function loadAndValidateWorksheet(followupId: string, answers: any) {
  const worksheetData = await loadFollowupById(followupId);
  
  if (!worksheetData || !worksheetData.worksheet) {
    return {
      error: 'Follow-up worksheet not found',
      status: 404,
      data: null
    };
  }
  
  // Skip validation if we have the worksheet data
  // The original validateFollowupAnswers expects a WorksheetType but we have a follow-up ID
  // Since we already have the worksheet data, we can do basic validation here
  
  // Check if we have at least some answers
  const answerKeys = Object.keys(answers);
  if (answerKeys.length === 0) {
    console.warn(`No answers provided for worksheet: ${followupId}`);
    return {
      error: 'No answers provided for the worksheet',
      status: 400,
      data: null
    };
  }
  
  // Get all valid question IDs from the worksheet
  const questionIds = worksheetData.worksheet.sections
    .flatMap((section: any) => section.questions)
    .map((q: any) => q.id);
  
  // Check that all provided answers correspond to valid questions
  const invalidAnswerKeys = answerKeys.filter(key => !questionIds.includes(key));
  if (invalidAnswerKeys.length > 0) {
    console.warn(`Invalid answer keys found: ${invalidAnswerKeys.join(', ')}`);
    return {
      error: 'Invalid answers provided for the worksheet',
      status: 400,
      data: null
    };
  }
  
  // Parse the answers to ensure consistent format
  // If answers is already an object, use it directly; otherwise parse it
  const parsedAnswers = typeof answers === 'string' ? parseFormattedAnswers(answers) : answers;
  
  const followupType = getFollowupType(followupId);
  const pillarId = followupType === 'pillar' ? extractPillarId(followupId) : null;
  
  return {
    error: null,
    status: 200,
    data: {
      worksheetData,
      followupType,
      pillarId,
      parsedAnswers
    }
  };
}
