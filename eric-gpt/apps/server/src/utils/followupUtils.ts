/**
 * Follow-up Worksheet Utilities
 * Functions for handling follow-up worksheets based on diagnosis results
 */

import { loadFollowupById } from './workbookLoader';

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
 * Available pillar worksheet types
 */
export const PILLAR_TYPES = [
  'pillar1_leadership_mindset',
  'pillar2_goal_setting',
  'pillar3_communication_mastery',
  'pillar4_time_mastery',
  'pillar5_strategic_thinking',
  'pillar6_emotional_intelligence',
  'pillar7_delegation_empowerment',
  'pillar8_change_uncertainty',
  'pillar9_conflict_resolution',
  'pillar10_high_performance',
  'pillar11_decision_making',
  'pillar12_execution_results'
] as const;

export type PillarType = typeof PILLAR_TYPES[number];

/**
 * Available follow-up worksheet types
 */
export const FOLLOWUP_TYPES = [
  'followup-1',
  'followup-2',
  'followup-3',
  'followup-4'
] as const;

export type FollowupType = typeof FOLLOWUP_TYPES[number];

/**
 * Combined worksheet types (both pillars and follow-ups)
 */
export const WORKSHEET_TYPES = [...PILLAR_TYPES, ...FOLLOWUP_TYPES] as const;

export type WorksheetType = typeof WORKSHEET_TYPES[number];

/**
 * Loads a worksheet by its type (either pillar or follow-up)
 * @param worksheetType Type of worksheet to load
 * @returns Worksheet data or null if not found
 */
export async function loadWorksheet(worksheetType: WorksheetType): Promise<FollowupWorksheet | null> {
  try {
    // Validate the worksheet type
    if (!WORKSHEET_TYPES.includes(worksheetType as any)) {
      console.error(`Invalid worksheet type: ${worksheetType}`);
      return null;
    }
    
    // Load the worksheet from the workbook loader
    const worksheet = await loadFollowupById(worksheetType);
    
    if (!worksheet) {
      console.error(`Worksheet not found: ${worksheetType}`);
      return null;
    }
    
    return {
      id: worksheet.id,
      title: worksheet.title,
      description: worksheet.description || '',
      questions: extractQuestions(worksheet)
    };
  } catch (error) {
    console.error('Error loading worksheet:', error);
    return null;
  }
}

/**
 * Extract questions from a worksheet based on its structure
 * @param worksheet The worksheet object
 * @returns Array of questions
 */
function extractQuestions(worksheet: any): FollowupQuestion[] {
  // Handle follow-up worksheets structure
  if (worksheet.sections && Array.isArray(worksheet.sections)) {
    // Flatten questions from all sections
    return worksheet.sections.flatMap((section: any) => 
      section.questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options
      }))
    );
  }
  
  // Handle pillar worksheets structure
  if (worksheet.fields && Array.isArray(worksheet.fields)) {
    return worksheet.fields
      .filter((field: any) => field.type !== 'info') // Skip info fields
      .map((field: any) => ({
        id: field.name,
        text: field.label,
        type: mapFieldTypeToQuestionType(field.type),
        options: field.options
      }));
  }
  
  return [];
}

/**
 * Maps pillar worksheet field types to follow-up question types
 * @param fieldType The field type from pillar worksheet
 * @returns The corresponding question type
 */
function mapFieldTypeToQuestionType(fieldType: string): string {
  switch (fieldType) {
    case 'textarea':
      return 'textarea';
    case 'checkbox':
      return 'checkbox';
    case 'rating':
      return 'rating';
    case 'text':
      return 'text';
    default:
      return 'text';
  }
}

/**
 * Loads a follow-up worksheet by its type (legacy function for backward compatibility)
 * @param followupType Type of follow-up worksheet to load
 * @returns Follow-up worksheet data or null if not found
 */
export async function loadFollowupWorksheet(followupType: FollowupType): Promise<FollowupWorksheet | null> {
  return loadWorksheet(followupType);
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
