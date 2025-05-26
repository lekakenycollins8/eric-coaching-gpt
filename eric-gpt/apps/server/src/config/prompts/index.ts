/**
 * Centralized export of all system prompts
 */

// Import base prompt
import { BASE_SYSTEM_PROMPT } from './base';

// Import all prompts from their respective files
import { LEADERSHIP_MINDSET, PILLAR1_PROMPT } from './leadership-mindset';
import { GOAL_SETTING, PILLAR2_PROMPT } from './goal-setting';
import { COMMUNICATION_MASTERY, PILLAR3_PROMPT } from './communication-mastery';
import { TIME_MASTERY, PILLAR4_PROMPT } from './time-mastery';
import { STRATEGIC_THINKING, PILLAR5_PROMPT } from './strategic-thinking';
import { EMOTIONAL_INTELLIGENCE, PILLAR6_PROMPT } from './emotional-intelligence';
import { DELEGATION_EMPOWERMENT, PILLAR7_PROMPT } from './delegation-empowerment';
import { CHANGE_UNCERTAINTY, PILLAR8_PROMPT } from './change-uncertainty';
import { CONFLICT_RESOLUTION, PILLAR9_PROMPT } from './conflict-resolution';
import { HIGH_PERFORMANCE, PILLAR10_PROMPT } from './high-performance';
import { DECISION_MAKING, PILLAR11_PROMPT } from './decision-making';
import { EXECUTION_RESULTS, PILLAR12_PROMPT } from './execution-results';

// Re-export all prompts for external use
export {
  BASE_SYSTEM_PROMPT,
  LEADERSHIP_MINDSET, PILLAR1_PROMPT,
  GOAL_SETTING, PILLAR2_PROMPT,
  COMMUNICATION_MASTERY, PILLAR3_PROMPT,
  TIME_MASTERY, PILLAR4_PROMPT,
  STRATEGIC_THINKING, PILLAR5_PROMPT,
  EMOTIONAL_INTELLIGENCE, PILLAR6_PROMPT,
  DELEGATION_EMPOWERMENT, PILLAR7_PROMPT,
  CHANGE_UNCERTAINTY, PILLAR8_PROMPT,
  CONFLICT_RESOLUTION, PILLAR9_PROMPT,
  HIGH_PERFORMANCE, PILLAR10_PROMPT,
  DECISION_MAKING, PILLAR11_PROMPT,
  EXECUTION_RESULTS, PILLAR12_PROMPT
};

/**
 * Map of all system prompts for easy lookup
 */
export const SYSTEM_PROMPTS = {
  // General worksheet categories
  LEADERSHIP_MINDSET,
  GOAL_SETTING,
  COMMUNICATION_MASTERY,
  TIME_MASTERY,
  STRATEGIC_THINKING,
  EMOTIONAL_INTELLIGENCE,
  DELEGATION_EMPOWERMENT,
  CHANGE_UNCERTAINTY,
  CONFLICT_RESOLUTION,
  HIGH_PERFORMANCE,
  DECISION_MAKING,
  EXECUTION_RESULTS,
  
  // Specific pillar prompts
  pillar1_prompt: PILLAR1_PROMPT,
  pillar2_prompt: PILLAR2_PROMPT,
  pillar3_prompt: PILLAR3_PROMPT,
  pillar4_prompt: PILLAR4_PROMPT,
  pillar5_prompt: PILLAR5_PROMPT,
  pillar6_prompt: PILLAR6_PROMPT,
  pillar7_prompt: PILLAR7_PROMPT,
  pillar8_prompt: PILLAR8_PROMPT,
  pillar9_prompt: PILLAR9_PROMPT,
  pillar10_prompt: PILLAR10_PROMPT,
  pillar11_prompt: PILLAR11_PROMPT,
  pillar12_prompt: PILLAR12_PROMPT
};

/**
 * Gets the system prompt for a given key
 * @param systemPromptKey - The key to look up in the SYSTEM_PROMPTS object
 * @returns The system prompt to use
 */
export function getSystemPromptByKey(systemPromptKey: string): string {
  // Check if the systemPromptKey exists directly in the SYSTEM_PROMPTS object
  if (systemPromptKey in SYSTEM_PROMPTS) {
    return SYSTEM_PROMPTS[systemPromptKey as keyof typeof SYSTEM_PROMPTS];
  }
  
  // Default to the base prompt if no match is found
  console.warn(`No specific prompt found for system prompt key: ${systemPromptKey}, using generic prompt`);
  return BASE_SYSTEM_PROMPT;
}

/**
 * Gets the appropriate system prompt for a worksheet
 * @param worksheetId - The ID of the worksheet
 * @param systemPromptKey - Optional system prompt key
 * @returns The system prompt to use
 */
export function getSystemPromptForWorksheet(worksheetId: string, systemPromptKey?: string): string {
  // If systemPromptKey is provided, use it directly
  if (systemPromptKey) {
    return getSystemPromptByKey(systemPromptKey);
  }
  
  // Otherwise, try to infer from the worksheet ID
  if (worksheetId.includes('leadership_mindset')) {
    return SYSTEM_PROMPTS.LEADERSHIP_MINDSET;
  } else if (worksheetId.includes('goal_setting')) {
    return SYSTEM_PROMPTS.GOAL_SETTING;
  } else if (worksheetId.includes('communication')) {
    return SYSTEM_PROMPTS.COMMUNICATION_MASTERY;
  } else if (worksheetId.includes('time_mastery')) {
    return SYSTEM_PROMPTS.TIME_MASTERY;
  } else if (worksheetId.includes('strategic_thinking')) {
    return SYSTEM_PROMPTS.STRATEGIC_THINKING;
  } else if (worksheetId.includes('emotional_intelligence')) {
    return SYSTEM_PROMPTS.EMOTIONAL_INTELLIGENCE;
  } else if (worksheetId.includes('delegation')) {
    return SYSTEM_PROMPTS.DELEGATION_EMPOWERMENT;
  } else if (worksheetId.includes('change')) {
    return SYSTEM_PROMPTS.CHANGE_UNCERTAINTY;
  } else if (worksheetId.includes('conflict')) {
    return SYSTEM_PROMPTS.CONFLICT_RESOLUTION;
  } else if (worksheetId.includes('performance')) {
    return SYSTEM_PROMPTS.HIGH_PERFORMANCE;
  } else if (worksheetId.includes('decision')) {
    return SYSTEM_PROMPTS.DECISION_MAKING;
  } else if (worksheetId.includes('execution')) {
    return SYSTEM_PROMPTS.EXECUTION_RESULTS;
  }
  
  // Default to the base prompt if no match is found
  console.warn(`No specific prompt found for worksheet ID: ${worksheetId}, using generic prompt`);
  return BASE_SYSTEM_PROMPT;
}

/**
 * Formats user worksheet responses into a prompt for the AI
 * @param worksheetTitle - The title of the worksheet
 * @param answers - The user's answers to the worksheet questions
 * @returns Formatted prompt string
 */
export function formatUserPrompt(
  worksheetTitle: string,
  answers: Record<string, any>
): string {
  // Create a header with the worksheet title
  let prompt = `## ${worksheetTitle} Worksheet Responses\n\n`;
  
  // Add each question and answer
  for (const [key, value] of Object.entries(answers)) {
    // Format the key as a question (removing camelCase/snake_case formatting)
    const question = key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim()
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
    
    // Format the value based on its type
    let formattedValue = '';
    if (Array.isArray(value)) {
      formattedValue = value.join(', ');
    } else if (typeof value === 'boolean') {
      formattedValue = value ? 'Yes' : 'No';
    } else {
      formattedValue = String(value);
    }
    
    // Add to the prompt
    prompt += `### ${question}\n${formattedValue}\n\n`;
  }
  
  // Add a closing request for feedback
  prompt += `Based on these responses, please provide your coaching feedback following the structure outlined in your instructions.`;
  
  return prompt;
}
