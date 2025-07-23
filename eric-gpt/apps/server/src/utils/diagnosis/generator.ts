import { openai } from '@/services/openai';
import { openaiConfig } from '@/config/openai';
import { DIAGNOSIS_PROMPT, DIAGNOSIS_SYSTEM_MESSAGE } from '@/config/prompts/diagnosis';
import { WorksheetType } from '../followupUtils';
import { DiagnosisResponse, FormattedQA } from './interfaces';
import { parseDiagnosisResponse } from './parser';

/**
 * Generates an AI diagnosis based on workbook answers
 * @param formattedAnswers Array of question-answer pairs
 * @param clientName Name of the client
 * @param previousSubmissions Optional previous submissions for context
 * @returns Structured diagnosis object
 */
export async function generateAIDiagnosis(
  formattedAnswers: FormattedQA[],
  clientName: string,
  previousSubmissions?: {
    worksheetId: WorksheetType;
    submissionDate: Date;
    summary: string;
    answers?: FormattedQA[];
    diagnosis?: DiagnosisResponse;
  }[]
): Promise<DiagnosisResponse> {
  // Generate the prompt using the template from config
  let prompt = DIAGNOSIS_PROMPT
    .replace('{{clientName}}', clientName)
    .replace('{{formattedAnswers}}', 
      formattedAnswers.map(qa => `Question: ${qa.question}\nAnswer: ${qa.answer}\n`).join('\n')
    );

  // Add previous context if available
  let previousContext = '';
  if (previousSubmissions && previousSubmissions.length > 0) {
    // Sort by submission date (newest first)
    const sortedSubmissions = [...previousSubmissions].sort(
      (a, b) => b.submissionDate.getTime() - a.submissionDate.getTime()
    );
    
    // Take up to 2 most recent submissions
    const recentSubmissions = sortedSubmissions.slice(0, 2);
    
    // Format previous context
    previousContext = recentSubmissions.map(sub => {
      const worksheetName = getWorksheetNameById(sub.worksheetId);
      const submissionDate = sub.submissionDate.toLocaleDateString();
      
      // Include key Q&A if available (up to 3)
      let keyQA = '';
      if (sub.answers && sub.answers.length > 0) {
        keyQA = '\n\nKey responses:\n' + sub.answers.slice(0, 3).map(
          qa => `Q: ${qa.question}\nA: ${qa.answer}`
        ).join('\n\n');
      }
      
      // Include previous diagnosis summary
      const diagnosisSummary = sub.diagnosis ? 
        `\n\nPrevious diagnosis: ${sub.diagnosis.summary}` : 
        `\n\nSummary: ${sub.summary}`;
      
      return `## Previous Worksheet: ${worksheetName} (${submissionDate})${keyQA}${diagnosisSummary}`;
    }).join('\n\n');
  }
  
  // Replace the previous context placeholder
  prompt = prompt.replace('{{previousContext}}', previousContext || 'No previous context available.');
  
  try {
    console.log('Generating diagnosis for client:', clientName);
    
    // Call OpenAI with enhanced context
    const completion = await openai.chat.completions.create({
      model: openaiConfig.defaultModel,
      messages: [
        { role: 'system', content: DIAGNOSIS_SYSTEM_MESSAGE },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000, // Increased token limit to accommodate more detailed response
      temperature: 0.7,
    });

    console.log(`Diagnosis generated successfully. Model: ${completion.model}, Tokens used: ${completion.usage?.total_tokens || 0}`);
    
    const diagnosisText = completion.choices[0]?.message?.content || '';
    
    // Parse the AI response into structured diagnosis
    return parseDiagnosisResponse(diagnosisText);
  } catch (error: any) {
    console.error('Error generating diagnosis:', error);
    throw new Error(`Failed to generate diagnosis: ${error.message}`);
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
      .replace(/^\\d+_/, '')
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
