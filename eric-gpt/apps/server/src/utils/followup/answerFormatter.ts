import { FollowupCategoryType } from '@/utils/followupUtils';

/**
 * Format answers for display in the AI prompt
 * @param answers Raw answers object from submission
 * @returns Formatted string representation of answers
 */
export function formatAnswers(answers: Record<string, any>): string {
  if (!answers || Object.keys(answers).length === 0) {
    return 'No answers provided';
  }

  return Object.entries(answers)
    .map(([key, value]) => {
      // Format the question key to be more readable
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
      
      // Format the value based on its type
      let formattedValue = '';
      if (typeof value === 'boolean') {
        formattedValue = value ? 'Yes' : 'No';
      } else if (Array.isArray(value)) {
        formattedValue = value.join(', ');
      } else if (value === null || value === undefined) {
        formattedValue = 'Not provided';
      } else if (typeof value === 'object') {
        formattedValue = JSON.stringify(value, null, 2);
      } else {
        formattedValue = String(value);
      }
      
      return `Question: ${formattedKey}\nAnswer: ${formattedValue}`;
    })
    .join('\n\n');
}

/**
 * Format follow-up history for context
 * @param followupSubmission The follow-up submission object
 * @returns Formatted string representation of follow-up history
 */
export function formatFollowupHistory(followupSubmission: any): string {
  if (!followupSubmission || !followupSubmission.answers) {
    return '';
  }
  
  return formatAnswers(followupSubmission.answers);
}

/**
 * Parse a formatted answers string back to an object
 * @param formattedAnswers The formatted answers string
 * @returns Parsed answers object
 */
export function parseFormattedAnswers(formattedAnswers: string): Record<string, any> {
  const parsedAnswers: Record<string, any> = {};
  
  try {
    // Try to parse the answers if they're in JSON format
    if (formattedAnswers.startsWith('{') && formattedAnswers.endsWith('}')) {
      Object.assign(parsedAnswers, JSON.parse(formattedAnswers));
    } else {
      // Otherwise, create a simple object with the raw text
      parsedAnswers.rawText = formattedAnswers;
      
      // Try to extract question-answer pairs
      const pairs = formattedAnswers.split('\n\n');
      pairs.forEach(pair => {
        // Use a regex that works without the 's' flag (which requires ES2018+)
        const match = pair.match(/Question: ([\s\S]*?)\nAnswer: ([\s\S]*)/);
        if (match) {
          const [, question, answer] = match;
          parsedAnswers[question] = answer;
        }
      });
    }
  } catch (error) {
    console.error('Error parsing formatted answers:', error);
    parsedAnswers.rawText = formattedAnswers;
  }
  
  return parsedAnswers;
}
