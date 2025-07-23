import { DIAGNOSIS_PROMPT, DIAGNOSIS_SYSTEM_MESSAGE } from '@/config/prompts/diagnosis';
import { DiagnosisResponse, IDiagnosisResult } from './interfaces';
import { parseDiagnosisResponse } from './parser';
import { WorksheetType } from '../followupUtils';
import { openai } from '@/services/openai';
import { DEFAULT_MODEL } from '@/config/openai';

/**
 * Generate an AI diagnosis based on formatted workbook answers
 * @param formattedAnswers Formatted Q&A from the workbook
 * @param userName User's name
 * @param previousDiagnosis Optional previous diagnosis for context
 * @returns Structured diagnosis response
 */
export async function generateAIDiagnosis(
  formattedAnswers: string,
  userName: string,
  previousDiagnosis?: IDiagnosisResult
): Promise<DiagnosisResponse> {
  try {
    // Prepare previous context if available
    let previousContext = '';
    if (previousDiagnosis) {
      previousContext = `Previous diagnosis summary: ${previousDiagnosis.summary}`;
    }
    
    // Prepare the prompt with variables
    const prompt = DIAGNOSIS_PROMPT
      .replace('{{clientName}}', userName)
      .replace('{{formattedAnswers}}', formattedAnswers)
      .replace('{{previousContext}}', previousContext);
    
    // Log formatted answers sample for debugging
    console.log(`Formatted answers text sample: ${formattedAnswers.substring(0, 150)}...`);
    
    // Prepare the enhanced system message with formatting instructions
    const enhancedSystemMessage = `${DIAGNOSIS_SYSTEM_MESSAGE}

Formatting instructions:
1. Use markdown headings (##) for each section
2. Format lists as bullet points with dashes (-)
3. Keep the exact section headings as specified
4. Include specific pillar IDs in the recommendations
5. Always include the exact pillar IDs as specified in the prompt`;
    
    console.log(`Generating diagnosis using model: ${DEFAULT_MODEL}`);
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: enhancedSystemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });
    
    // Extract the generated text
    const generatedText = response.choices[0].message.content || '';
    
    console.log(`Generated diagnosis text (${response.usage?.total_tokens} tokens)`);
    console.log('Generated text sample:', generatedText.substring(0, 200) + '...');
    
    // Parse the response into structured format
    return parseDiagnosisResponse(generatedText);
  } catch (error) {
    console.error('Error generating diagnosis:', error);
    throw error;
  }
}

/**
 * Helper function to get a readable worksheet name from its ID
 * @param worksheetId The worksheet ID
 * @returns Human-readable worksheet name
 */
export function getWorksheetNameById(worksheetId: WorksheetType): string {
  // Convert pillar IDs to readable names
  if (worksheetId.startsWith('pillar')) {
    return worksheetId
      .replace('pillar', 'Leadership Pillar: ')
      .replace(/^\d+_/, '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Convert follow-up IDs to readable names
  if (worksheetId.startsWith('followup')) {
    const followupNames: Record<string, string> = {
      'followup-1': 'Ask the Right Questions',
      'followup-2': 'Identify the Issues',
      'followup-3': 'Find the Best Solution',
      'followup-4': 'Execute and Succeed'
    };
    return followupNames[worksheetId] || worksheetId;
  }
  
  return worksheetId;
}
