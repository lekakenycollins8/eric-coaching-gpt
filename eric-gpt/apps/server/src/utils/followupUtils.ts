/**
 * Follow-up Worksheet Utilities
 * Functions for handling follow-up worksheets based on diagnosis results
 */

import { loadWorkbook } from './workbookLoader';

/**
 * Interface for follow-up worksheet metadata
 */
export interface FollowupWorksheet {
  id: string;
  title: string;
  description: string;
  questions: FollowupQuestion[];
}

/**
 * Interface for follow-up worksheet questions
 */
export interface FollowupQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiline' | 'scale' | 'choice';
  options?: string[];
}

/**
 * Available follow-up worksheet types
 */
export const FOLLOWUP_TYPES = [
  'communication',
  'delegation',
  'strategic-thinking',
  'emotional-intelligence',
  'conflict-resolution'
] as const;

export type FollowupType = typeof FOLLOWUP_TYPES[number];

/**
 * Loads a follow-up worksheet by its type
 * @param followupType Type of follow-up worksheet to load
 * @returns Follow-up worksheet data or null if not found
 */
export async function loadFollowupWorksheet(followupType: FollowupType): Promise<FollowupWorksheet | null> {
  try {
    // For now, we'll use a simple mapping to predefined worksheets
    // In the future, this could be loaded from a database or file system
    
    // Validate the followup type
    if (!FOLLOWUP_TYPES.includes(followupType as any)) {
      console.error(`Invalid follow-up worksheet type: ${followupType}`);
      return null;
    }
    
    // Load the base workbook structure to check if the follow-up exists
    const workbook = await loadWorkbook();
    if (!workbook || !workbook.followupWorksheets) {
      console.error('Failed to load workbook or follow-up worksheets');
      return null;
    }
    
    // Find the requested follow-up worksheet
    const followup = workbook.followupWorksheets.find(
      (ws: any) => ws.id === followupType
    );
    
    if (!followup) {
      console.error(`Follow-up worksheet not found: ${followupType}`);
      return null;
    }
    
    return {
      id: followup.id,
      title: followup.title,
      description: followup.description,
      questions: followup.questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options
      }))
    };
  } catch (error) {
    console.error('Error loading follow-up worksheet:', error);
    return null;
  }
}

/**
 * Validates follow-up worksheet answers
 * @param worksheetId ID of the follow-up worksheet
 * @param answers User's answers to the follow-up questions
 * @returns True if answers are valid, false otherwise
 */
export async function validateFollowupAnswers(
  worksheetId: string,
  answers: Record<string, string>
): Promise<boolean> {
  try {
    // Load the worksheet to validate against
    const worksheet = await loadFollowupWorksheet(worksheetId as FollowupType);
    if (!worksheet) {
      return false;
    }
    
    // Check if we have at least some answers
    const answerKeys = Object.keys(answers);
    if (answerKeys.length === 0) {
      return false;
    }
    
    // Check that all answers correspond to valid questions
    const questionIds = worksheet.questions.map(q => q.id);
    const validAnswers = answerKeys.every(key => questionIds.includes(key));
    
    return validAnswers;
  } catch (error) {
    console.error('Error validating follow-up answers:', error);
    return false;
  }
}
