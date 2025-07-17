import { openai } from '@/services/openai';
import { openaiConfig } from '@/config/openai';
import { DIAGNOSIS_PROMPT, DIAGNOSIS_SYSTEM_MESSAGE } from '@/config/prompts/diagnosis';

/**
 * Interface for formatted question-answer pairs
 */
export interface FormattedQA {
  question: string;
  answer: string;
}

/**
 * Interface for diagnosis result
 */
export interface Diagnosis {
  summary: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  followupId?: string;
}

/**
 * Generates an AI diagnosis based on workbook answers
 * @param formattedAnswers Array of question-answer pairs
 * @param clientName Name of the client
 * @param promptTemplate The prompt template to use
 * @returns Structured diagnosis object
 */
export async function generateAIDiagnosis(
  formattedAnswers: FormattedQA[],
  clientName: string
): Promise<Diagnosis> {
  // Generate the prompt using the template from config
  const prompt = DIAGNOSIS_PROMPT
    .replace('{{clientName}}', clientName)
    .replace('{{formattedAnswers}}', 
      formattedAnswers.map(qa => `Question: ${qa.question}\nAnswer: ${qa.answer}\n`).join('\n')
    );

  try {
    console.log('Generating diagnosis for client:', clientName);
    
    // Call OpenAI API using the service
    const completion = await openai.chat.completions.create({
      model: openaiConfig.defaultModel,
      messages: [
        { role: 'system', content: DIAGNOSIS_SYSTEM_MESSAGE },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
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
 * Parses the AI response into a structured diagnosis object
 * @param diagnosisText Raw text response from AI
 * @returns Structured diagnosis object
 */
export function parseDiagnosisResponse(diagnosisText: string): Diagnosis {
  // This is a simplified parser - in a real implementation,
  // you might want to use more robust parsing or have the AI
  // return structured data directly
  
  const sections = diagnosisText.split(/\n\s*\n/);
  
  let summary = '';
  const strengths: string[] = [];
  const challenges: string[] = [];
  const recommendations: string[] = [];
  let followupId = '';
  
  sections.forEach(section => {
    if (section.toLowerCase().includes('summary') || section.toLowerCase().includes('situation')) {
      summary = section.replace(/^.*summary.*?:/i, '').trim();
    } else if (section.toLowerCase().includes('strength')) {
      const items = section.split(/\n/).filter(line => line.match(/^\d+\.\s+/));
      items.forEach(item => strengths.push(item.replace(/^\d+\.\s+/, '').trim()));
    } else if (section.toLowerCase().includes('challenge') || section.toLowerCase().includes('growth area')) {
      const items = section.split(/\n/).filter(line => line.match(/^\d+\.\s+/));
      items.forEach(item => challenges.push(item.replace(/^\d+\.\s+/, '').trim()));
    } else if (section.toLowerCase().includes('recommendation')) {
      const items = section.split(/\n/).filter(line => line.match(/^\d+\.\s+/));
      items.forEach(item => recommendations.push(item.replace(/^\d+\.\s+/, '').trim()));
    } else if (section.toLowerCase().includes('follow-up worksheet')) {
      if (section.toLowerCase().includes('communication')) followupId = 'communication';
      else if (section.toLowerCase().includes('delegation')) followupId = 'delegation';
      else if (section.toLowerCase().includes('strategic')) followupId = 'strategic-thinking';
      else if (section.toLowerCase().includes('emotional')) followupId = 'emotional-intelligence';
      else if (section.toLowerCase().includes('conflict')) followupId = 'conflict-resolution';
    }
  });
  
  return {
    summary,
    strengths,
    challenges,
    recommendations,
    followupId
  };
}

/**
 * Determines the most appropriate follow-up worksheet based on the diagnosis
 * @param diagnosis Structured diagnosis object
 * @returns ID of the recommended follow-up worksheet
 */
export function determineFollowupWorksheet(diagnosis: Diagnosis): string {
  // If the AI already suggested a follow-up, use that
  if (diagnosis.followupId) {
    return diagnosis.followupId;
  }
  
  // Simple keyword-based matching as a fallback
  const allText = [
    diagnosis.summary,
    ...diagnosis.challenges,
    ...diagnosis.recommendations
  ].join(' ').toLowerCase();
  
  if (allText.includes('communicat') || allText.includes('listen') || allText.includes('express')) {
    return 'communication';
  } else if (allText.includes('delegat') || allText.includes('micromanag') || allText.includes('trust')) {
    return 'delegation';
  } else if (allText.includes('strateg') || allText.includes('vision') || allText.includes('plan')) {
    return 'strategic-thinking';
  } else if (allText.includes('emotion') || allText.includes('empath') || allText.includes('self-aware')) {
    return 'emotional-intelligence';
  } else if (allText.includes('conflict') || allText.includes('disagree') || allText.includes('tension')) {
    return 'conflict-resolution';
  }
  
  // Default to emotional intelligence if no clear match
  return 'emotional-intelligence';
}
