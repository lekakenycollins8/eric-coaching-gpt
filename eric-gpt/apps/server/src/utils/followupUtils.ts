/**
 * Follow-up Worksheet Utilities
 * Functions for handling follow-up worksheets based on diagnosis results
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import mongoose from 'mongoose';

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
 * Interface for worksheet questions (both pillar and follow-up)
 */
export interface FollowupQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiline' | 'scale' | 'choice' | 'textarea' | 'rating' | 'checkbox' | 'info';
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
 * Follow-up category types
 */
export type FollowupCategoryType = 'pillar' | 'workbook';

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
    
    // Load the worksheet using the loadFollowupById function
    const { worksheet } = await loadFollowupById(worksheetType);
    
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
function mapFieldTypeToQuestionType(fieldType: string): FollowupQuestion['type'] {
  switch (fieldType) {
    case 'textarea':
      return 'textarea';
    case 'checkbox':
      return 'checkbox';
    case 'rating':
      return 'rating';
    case 'text':
      return 'text';
    case 'info':
      return 'info';
    case 'scale':
      return 'scale';
    case 'choice':
      return 'choice';
    case 'multiline':
      return 'multiline';
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
 * Determines the type of follow-up worksheet based on its ID
 * @param followupId The ID of the follow-up worksheet
 * @returns The follow-up category type ('pillar' or 'workbook')
 */
export function getFollowupType(followupId: string): FollowupCategoryType {
  // First, check for exact patterns from crystal-clear-leadership-followup.json
  // Format: pillarX-followup (e.g., pillar1-followup, pillar12-followup)
  if (/^pillar\d+-followup$/.test(followupId)) {
    return 'pillar';
  }
  
  // Check for exact patterns from implementation-support-followup.json
  // Format: jackier-stepX-followup (e.g., jackier-step1-followup)
  if (/^jackier-step\d+-followup$/.test(followupId)) {
    return 'workbook';
  }
  
  // Fallback checks for other naming patterns
  // Check if it starts with 'pillar' and is likely a pillar-related worksheet
  if (/^pillar\d+/.test(followupId)) {
    return 'pillar';
  }
  
  // Check for implementation or workbook keywords
  if (followupId.includes('implementation') || 
      followupId.includes('workbook') || 
      followupId.includes('jackier')) {
    return 'workbook';
  }
  
  // Log a warning for IDs that don't match expected patterns
  console.warn(`Follow-up ID does not match expected patterns: ${followupId}`);
  
  // If the ID contains 'pillar' anywhere, assume it's a pillar follow-up
  if (followupId.includes('pillar')) {
    console.warn(`Assuming '${followupId}' is a pillar follow-up based on naming`);
    return 'pillar';
  }
  
  // Default to workbook follow-up if we can't determine the type
  console.warn(`Could not determine follow-up type for ID: ${followupId}, defaulting to 'workbook'`);
  return 'workbook';
}

/**
 * Extracts the pillar ID from a follow-up ID
 * @param followupId The ID of the follow-up worksheet
 * @returns The pillar ID or null if not a pillar follow-up
 */
export function extractPillarId(followupId: string): string | null {
  // Check for formats like 'pillar1-followup' or 'pillar1_leadership_mindset-followup'
  const pillarMatch = followupId.match(/pillar(\d+)[-_]/);
  if (pillarMatch) {
    const pillarNumber = pillarMatch[1];
    // Return the corresponding pillar ID from PILLAR_TYPES
    const pillarIndex = parseInt(pillarNumber) - 1;
    if (pillarIndex >= 0 && pillarIndex < PILLAR_TYPES.length) {
      return PILLAR_TYPES[pillarIndex];
    }
  }
  
  return null;
}

/**
 * Loads the appropriate context for a follow-up submission
 * @param originalSubmission The original workbook submission
 * @param followupType The type of follow-up ('pillar' or 'workbook')
 * @param pillarId Optional pillar ID for pillar follow-ups
 * @returns The context object with relevant data for the follow-up
 */
export function loadFollowupContext(originalSubmission: any, followupType: FollowupCategoryType, pillarId?: string): any {
  // Base context with common fields
  const baseContext = {
    userId: originalSubmission.userId,
    userName: originalSubmission.userName,
    submissionDate: originalSubmission.submissionDate,
    diagnosisGeneratedAt: originalSubmission.diagnosisGeneratedAt
  };
  
  if (followupType === 'pillar' && pillarId) {
    // For pillar follow-ups, first try to find pillar data in the workbook submission
    let pillarData = originalSubmission.pillars?.find((p: any) => 
      p.worksheetId === pillarId || p.worksheetId.includes(pillarId)
    );
    
    // If pillar data is not found in the workbook submission, we'll need to look for
    // a separate pillar submission in the database. This will be handled in the submit route.
    // Here we just prepare the context with what we have.
    
    return {
      ...baseContext,
      pillarId,
      pillarAnswers: pillarData?.answers || {},
      pillarDiagnosis: pillarData?.diagnosis || {},
      originalDiagnosis: originalSubmission.diagnosis || {},
      needsPillarSubmissionLookup: !pillarData // Flag to indicate we need to look up a separate pillar submission
    };
  } else {
    // For workbook follow-ups, include overall workbook data
    return {
      ...baseContext,
      workbookAnswers: originalSubmission.answers || {},
      workbookDiagnosis: originalSubmission.diagnosis || {},
      followupHistory: originalSubmission.followup ? [originalSubmission.followup] : []
    };
  }
}

/**
 * Loads a follow-up worksheet by its ID
 * @param id The ID of the follow-up worksheet to load
 * @returns Object containing the worksheet and its type
 */
export async function loadFollowupById(id: string): Promise<{ worksheet: any; type: string }> {
  try {
    // Try to find the worksheet in pillar follow-ups first
    let worksheet = null;
    let worksheetType = '';
    
    const dataDir = path.join(process.cwd(), 'src/data');
    
    // Try to load from crystal-clear-leadership-followup.json (pillar follow-ups)
    try {
      const pillarFollowupsPath = path.join(dataDir, 'crystal-clear-leadership-followup.json');
      if (fs.existsSync(pillarFollowupsPath)) {
        const pillarFollowups = JSON.parse(fs.readFileSync(pillarFollowupsPath, 'utf8'));
        worksheet = pillarFollowups.find((w: any) => w.id === id);
        
        if (worksheet) {
          worksheetType = 'pillar';
        }
      }
    } catch (error) {
      console.error('Error loading pillar follow-up worksheets:', error);
    }
    
    // If not found in pillar follow-ups, try implementation follow-ups
    if (!worksheet) {
      try {
        const implementationFollowupsPath = path.join(dataDir, 'implementation-support-followup.json');
        if (fs.existsSync(implementationFollowupsPath)) {
          const implementationFollowups = JSON.parse(fs.readFileSync(implementationFollowupsPath, 'utf8'));
          worksheet = implementationFollowups.find((w: any) => w.id === id);
          
          if (worksheet) {
            worksheetType = 'implementation';
          }
        }
      } catch (error) {
        console.error('Error loading implementation follow-up worksheets:', error);
      }
    }
    
    return { worksheet, type: worksheetType };
  } catch (error) {
    console.error(`Error loading follow-up worksheet ${id}:`, error);
    throw error;
  }
}

/**
 * Validates worksheet answers for both pillar and follow-up worksheets
 * @param worksheetId ID of the worksheet (pillar or follow-up)
 * @param answers User's answers to the worksheet questions
 * @returns True if answers are valid, false otherwise
 */
export async function validateFollowupAnswers(
  worksheetId: WorksheetType,
  answers: Record<string, string | number | boolean | string[]>
): Promise<boolean> {
  try {
    // Load the worksheet to validate against
    const worksheet = await loadWorksheet(worksheetId);
    if (!worksheet) {
      console.error(`Worksheet not found for validation: ${worksheetId}`);
      return false;
    }
    
    // Check if we have at least some answers
    const answerKeys = Object.keys(answers);
    if (answerKeys.length === 0) {
      console.warn(`No answers provided for worksheet: ${worksheetId}`);
      return false;
    }
    
    // Get all valid question IDs from the worksheet
    const questionIds = worksheet.questions.map(q => q.id);
    
    // Check that all provided answers correspond to valid questions
    const invalidAnswerKeys = answerKeys.filter(key => !questionIds.includes(key));
    if (invalidAnswerKeys.length > 0) {
      console.warn(`Invalid answer keys found: ${invalidAnswerKeys.join(', ')}`);
      return false;
    }
    
    // Validate answer types based on question types
    for (const question of worksheet.questions) {
      const answer = answers[question.id];
      
      // Skip validation for questions that weren't answered
      if (answer === undefined) continue;
      
      // Validate based on question type
      switch (question.type) {
        case 'scale':
        case 'rating':
          // Rating should be a number between 1-5 or 1-10
          if (typeof answer !== 'number' && typeof answer !== 'string') {
            console.warn(`Invalid rating answer type for question ${question.id}: ${typeof answer}`);
            return false;
          }
          const numValue = Number(answer);
          if (isNaN(numValue) || numValue < 1 || numValue > 10) {
            console.warn(`Invalid rating value for question ${question.id}: ${answer}`);
            return false;
          }
          break;
          
        case 'choice':
          // Choice should be one of the available options
          if (!question.options?.includes(answer as string)) {
            console.warn(`Invalid choice for question ${question.id}: ${answer}`);
            return false;
          }
          break;
          
        case 'checkbox':
          // Checkbox answers should be boolean or array of selected options
          if (typeof answer !== 'boolean' && !Array.isArray(answer)) {
            console.warn(`Invalid checkbox answer type for question ${question.id}: ${typeof answer}`);
            return false;
          }
          break;
          
        case 'text':
        case 'textarea':
        case 'multiline':
          // Text answers should be strings and not empty
          if (typeof answer !== 'string') {
            console.warn(`Invalid text answer type for question ${question.id}: ${typeof answer}`);
            return false;
          }
          if ((answer as string).trim().length === 0) {
            console.warn(`Empty text answer for question ${question.id}`);
            return false;
          }
          break;
          
        default:
          // For any other type, just ensure the answer exists
          if (answer === null || answer === undefined) {
            console.warn(`Missing answer for question ${question.id}`);
            return false;
          }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating worksheet answers:', error);
    return false;
  }
}
