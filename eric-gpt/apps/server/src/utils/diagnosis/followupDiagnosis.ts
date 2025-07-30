import { openai } from '@/services/openai';
import { DEFAULT_MODEL } from '@/config/openai';
import { FollowupCategoryType } from '@/utils/followupUtils';
import { PILLAR_FOLLOWUP_PROMPT, PILLAR_FOLLOWUP_SYSTEM_MESSAGE } from '@/config/prompts/pillarFollowupPrompt';
import { WORKBOOK_FOLLOWUP_PROMPT, WORKBOOK_FOLLOWUP_SYSTEM_MESSAGE } from '@/config/prompts/workbookFollowupPrompt';

/**
 * Format answers for better readability in the prompt
 * @param answers The answers to format
 * @returns Formatted answers as a string
 */
function formatAnswersForPrompt(answers: Record<string, any>): string {
  if (!answers || Object.keys(answers).length === 0) {
    return 'No answers provided.';
  }
  
  let formatted = '';
  
  // Format each answer as a question-answer pair
  for (const [key, value] of Object.entries(answers)) {
    // Skip empty or undefined values
    if (value === undefined || value === null || value === '') continue;
    
    // Format the question key to be more readable
    const question = key
      .replace(/-/g, ' ')
      .replace(/p\d+/g, '') // Remove pillar number indicators like p1, p2
      .replace(/^(\w)/, (match) => match.toUpperCase()); // Capitalize first letter
    
    formatted += `**${question}**: ${value}\n\n`;
  }
  
  return formatted || 'No answers provided.';
}

/**
 * Format diagnosis data for better readability in the prompt
 * @param diagnosis The diagnosis data to format
 * @returns Formatted diagnosis as a string
 */
function formatDiagnosisForPrompt(diagnosis: any): string {
  if (!diagnosis) {
    return 'No previous diagnosis available.';
  }
  
  let formatted = '';
  
  // Add summary if available
  if (diagnosis.summary) {
    formatted += `**Summary**:\n${diagnosis.summary}\n\n`;
  }
  
  // Add strengths if available
  if (diagnosis.strengths && diagnosis.strengths.length > 0) {
    formatted += `**Strengths**:\n`;
    diagnosis.strengths.forEach((strength: string, index: number) => {
      formatted += `${index + 1}. ${strength}\n`;
    });
    formatted += '\n';
  }
  
  // Add challenges if available
  if (diagnosis.challenges && diagnosis.challenges.length > 0) {
    formatted += `**Challenges**:\n`;
    diagnosis.challenges.forEach((challenge: string, index: number) => {
      formatted += `${index + 1}. ${challenge}\n`;
    });
    formatted += '\n';
  }
  
  // Add recommendations if available
  if (diagnosis.recommendations && diagnosis.recommendations.length > 0) {
    formatted += `**Recommendations**:\n`;
    diagnosis.recommendations.forEach((recommendation: string, index: number) => {
      formatted += `${index + 1}. ${recommendation}\n`;
    });
    formatted += '\n';
  }
  
  // Add enhanced diagnosis sections if available
  if (diagnosis.situationAnalysis?.fullText) {
    formatted += `**Situation Analysis**:\n${diagnosis.situationAnalysis.fullText}\n\n`;
  }
  
  return formatted || 'No previous diagnosis available.';
}

/**
 * Extract a section from the generated text by heading
 * @param text The full text to extract from
 * @param sectionHeading The heading to look for
 * @param nextSectionHeading Optional next section heading to limit extraction
 * @returns The extracted section text
 */
export function extractSection(text: string, sectionHeading: string, nextSectionHeading?: string): string {
  // Find the section heading
  const sectionRegex = new RegExp(`## ${sectionHeading}\\s*\\n([\\s\\S]*?)(?:## ${nextSectionHeading}|$)`, 'i');
  const match = text.match(sectionRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return '';
}

/**
 * Interface for the diagnosis response structure
 */
export interface FollowupDiagnosisResponse {
  summary: string;
  situationAnalysis: string;
  strengthsAnalysis: string;
  growthAreasAnalysis: string;
  actionableRecommendations: string;
  pillarRecommendations?: string;
  followupRecommendation: string;
}

/**
 * Generate a follow-up diagnosis based on the follow-up type and context
 * @param followupType The type of follow-up ('pillar' or 'workbook')
 * @param contextData The context data for the follow-up
 * @returns The generated diagnosis response
 */
export async function generateFollowupDiagnosis(
  followupType: FollowupCategoryType,
  contextData: any
): Promise<FollowupDiagnosisResponse> {
  try {
    // Select the appropriate prompt and system message based on follow-up type
    const promptTemplate = followupType === 'pillar' ? PILLAR_FOLLOWUP_PROMPT : WORKBOOK_FOLLOWUP_PROMPT;
    const systemMessage = followupType === 'pillar' ? PILLAR_FOLLOWUP_SYSTEM_MESSAGE : WORKBOOK_FOLLOWUP_SYSTEM_MESSAGE;
    
    // Format the answers for better readability in the prompt
    const formattedAnswers = formatAnswersForPrompt(contextData.followupAnswers);
    const originalPillarAnswers = formatAnswersForPrompt(contextData.originalAnswers);
    
    // Format the original diagnosis for better readability
    const formattedOriginalDiagnosis = formatDiagnosisForPrompt(contextData.originalDiagnosis);
    
    console.log(`Preparing prompt with userName: ${contextData.userName}, pillarTitle: ${contextData.pillarTitle}`);
    
    // Format the prompt with context data
    let formattedPrompt = promptTemplate
      .replace(/\{\{originalAnswers\}\}/g, JSON.stringify(contextData.originalAnswers, null, 2))
      .replace(/\{\{followupAnswers\}\}/g, JSON.stringify(contextData.followupAnswers, null, 2))
      .replace(/\{\{originalDiagnosis\}\}/g, formattedOriginalDiagnosis)
      .replace(/\{\{worksheetTitle\}\}/g, contextData.worksheetTitle || 'Unknown Worksheet')
      .replace(/\{\{worksheetDescription\}\}/g, contextData.worksheetDescription || 'No description available')
      .replace(/\{\{timeElapsed\}\}/g, contextData.timeElapsed?.toString() || 'Unknown')
      .replace(/\{\{clientName\}\}/g, contextData.userName || 'Client')
      .replace(/\{\{pillarName\}\}/g, contextData.pillarTitle || 'Leadership')
      .replace(/\{\{formattedAnswers\}\}/g, formattedAnswers)
      .replace(/\{\{originalPillarAnswers\}\}/g, originalPillarAnswers)
      .replace(/\{\{pillarId\}\}/g, contextData.pillarId || '');
    
    // If it's a pillar follow-up, include the pillar-specific context
    if (followupType === 'pillar' && contextData.pillarId) {
      const pillarContext = `This follow-up is specifically for the "${contextData.pillarTitle || 'Unknown'}" pillar (ID: ${contextData.pillarId}).`;
      formattedPrompt = formattedPrompt.replace(/\{\{additionalContext\}\}/g, pillarContext);
    } else {
      formattedPrompt = formattedPrompt.replace(/\{\{additionalContext\}\}/g, '');
    }
    
    // Replace any remaining placeholders with empty strings to avoid them appearing in the output
    formattedPrompt = formattedPrompt.replace(/\{\{[^\}]+\}\}/g, '');
    
    console.log('Formatted prompt with all placeholders replaced');
    
    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: formattedPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });
    
    // Extract the generated text
    const generatedText = response.choices[0]?.message?.content || '';
    
    // Parse the response into a structured diagnosis
    return parseFollowupDiagnosis(generatedText, followupType);
  } catch (error) {
    console.error('Error generating follow-up diagnosis:', error);
    throw new Error('Failed to generate follow-up diagnosis');
  }
}

/**
 * Parse the generated text into a structured diagnosis response
 * @param generatedText The raw text generated by the AI
 * @param followupType The type of follow-up ('pillar' or 'workbook')
 * @returns The structured diagnosis response
 */
export function parseFollowupDiagnosis(
  generatedText: string,
  followupType: FollowupCategoryType
): FollowupDiagnosisResponse {
  return {
    summary: extractSection(generatedText, 'SUMMARY', followupType === 'pillar' ? 'PROGRESS ANALYSIS' : 'IMPLEMENTATION PROGRESS ANALYSIS'),
    situationAnalysis: followupType === 'pillar' ? 
      extractSection(generatedText, 'PROGRESS ANALYSIS', 'IMPLEMENTATION EFFECTIVENESS') :
      extractSection(generatedText, 'IMPLEMENTATION PROGRESS ANALYSIS', 'CROSS-PILLAR INTEGRATION'),
    strengthsAnalysis: followupType === 'pillar' ? 
      extractSection(generatedText, 'IMPLEMENTATION EFFECTIVENESS', 'ADJUSTED RECOMMENDATIONS') :
      extractSection(generatedText, 'CROSS-PILLAR INTEGRATION', 'IMPLEMENTATION BARRIERS'),
    growthAreasAnalysis: followupType === 'pillar' ? 
      extractSection(generatedText, 'ADJUSTED RECOMMENDATIONS', 'CONTINUED GROWTH PLAN') :
      extractSection(generatedText, 'IMPLEMENTATION BARRIERS', 'COMPREHENSIVE ADJUSTMENT PLAN'),
    actionableRecommendations: followupType === 'pillar' ? 
      extractSection(generatedText, 'CONTINUED GROWTH PLAN', 'COACHING SUPPORT ASSESSMENT') :
      extractSection(generatedText, 'COMPREHENSIVE ADJUSTMENT PLAN', 'NEXT FOCUS AREAS'),
    pillarRecommendations: followupType === 'workbook' ? 
      extractSection(generatedText, 'NEXT FOCUS AREAS', 'COACHING SUPPORT ASSESSMENT') : '',
    followupRecommendation: extractSection(generatedText, 'COACHING SUPPORT ASSESSMENT')
  };
}
