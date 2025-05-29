/**
 * Centralized export of all system prompts
 */

// Import base prompt
import { BASE_SYSTEM_PROMPT } from './base';

// Import all prompts from their respective files
import { PILLAR1_PROMPT } from './leadership-mindset';
import { PILLAR2_PROMPT } from './goal-setting';
import { PILLAR3_PROMPT } from './communication-mastery';
import { PILLAR4_PROMPT } from './time-mastery';
import { PILLAR5_PROMPT } from './strategic-thinking';
import { PILLAR6_PROMPT } from './emotional-intelligence';
import { PILLAR7_PROMPT } from './delegation-empowerment';
import { PILLAR8_PROMPT } from './change-uncertainty';
import { PILLAR9_PROMPT } from './conflict-resolution';
import { PILLAR10_PROMPT } from './high-performance';
import { PILLAR11_PROMPT } from './decision-making';
import { PILLAR12_PROMPT } from './execution-results';

// Re-export all prompts for external use
export {
  BASE_SYSTEM_PROMPT,
  PILLAR1_PROMPT,
  PILLAR2_PROMPT,
  PILLAR3_PROMPT,
  PILLAR4_PROMPT,
  PILLAR5_PROMPT,
  PILLAR6_PROMPT,
  PILLAR7_PROMPT,
  PILLAR8_PROMPT,
  PILLAR9_PROMPT,
  PILLAR10_PROMPT,
  PILLAR11_PROMPT,
  PILLAR12_PROMPT
};

/**
 * Map of all system prompts for easy lookup
 */
export const SYSTEM_PROMPTS = {
  // General worksheet categories
  
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
  if (worksheetId.includes('pillar1_leadership_mindset')) {
    return SYSTEM_PROMPTS.pillar1_prompt;
  } else if (worksheetId.includes('pillar2_goal_setting')) {
    return SYSTEM_PROMPTS.pillar2_prompt;
  } else if (worksheetId.includes('pillar3_communication_mastery')) {
    return SYSTEM_PROMPTS.pillar3_prompt;
  } else if (worksheetId.includes('pillar4_time_mastery')) {
    return SYSTEM_PROMPTS.pillar4_prompt;
  } else if (worksheetId.includes('pillar5_strategic_thinking')) {
    return SYSTEM_PROMPTS.pillar5_prompt;
  } else if (worksheetId.includes('pillar6_emotional_intelligence')) {
    return SYSTEM_PROMPTS.pillar6_prompt;
  } else if (worksheetId.includes('pillar7_delegation_empowerment')) {
    return SYSTEM_PROMPTS.pillar7_prompt;
  } else if (worksheetId.includes('pillar8_change_uncertainty')) {
    return SYSTEM_PROMPTS.pillar8_prompt;
  } else if (worksheetId.includes('pillar9_conflict_resolution')) {
    return SYSTEM_PROMPTS.pillar9_prompt;
  } else if (worksheetId.includes('pillar10_high_performance')) {
    return SYSTEM_PROMPTS.pillar10_prompt;
  } else if (worksheetId.includes('pillar11_decision_making')) {
    return SYSTEM_PROMPTS.pillar11_prompt;
  } else if (worksheetId.includes('pillar12_execution_results')) {
    return SYSTEM_PROMPTS.pillar12_prompt;
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
