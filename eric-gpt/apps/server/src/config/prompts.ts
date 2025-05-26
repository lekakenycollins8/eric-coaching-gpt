/**
 * System prompts for OpenAI API
 * 
 * This file is a simple re-export of the modular prompt system
 * for backward compatibility. All prompt definitions have been moved
 * to the config/prompts/ directory for better maintainability.
 */

import {
  BASE_SYSTEM_PROMPT,
  SYSTEM_PROMPTS,
  getSystemPromptByKey,
  getSystemPromptForWorksheet,
  formatUserPrompt
} from './prompts/index'; // Import from the modular prompt system

// Re-export everything from the modular prompt system
export {
  BASE_SYSTEM_PROMPT,
  SYSTEM_PROMPTS,
  getSystemPromptByKey,
  getSystemPromptForWorksheet,
  formatUserPrompt
};
