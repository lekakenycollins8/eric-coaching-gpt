import { IUser } from '../models/User';
import { openai } from '../services/openai';
import { CHALLENGE_ANALYSIS_PROMPT, RECOMMENDATION_CONTEXT_PROMPT } from '../config/prompts/challenge-analysis';

/**
 * Interface for the AI analysis response
 */
export interface AIAnalysisResponse {
  challenges: string[];
  analysis: string;
}

/**
 * Analyzes user's worksheet answers to identify specific challenges
 * 
 * @param worksheet The worksheet data
 * @param userAnswers User's answers to the worksheet questions
 * @param user User information for personalization
 * @returns Object containing identified challenges and detailed analysis
 */
export async function analyzeUserChallenges(
  worksheet: any,
  userAnswers: Record<string, any>,
  user?: IUser
): Promise<AIAnalysisResponse> {
  try {
    console.log(`[DEBUG] analyzeUserChallenges called for worksheet: ${worksheet?.id || 'unknown'}`);
    console.log(`[DEBUG] User answers received:`, Object.keys(userAnswers).length);
    
    // Default response in case AI analysis fails
    const defaultResponse: AIAnalysisResponse = {
      challenges: ['leadership', 'communication', 'goal-setting'],
      analysis: 'Based on the worksheet responses, the user may benefit from additional guidance in leadership development, communication skills, and goal setting.'
    };

    // If no OpenAI API key is configured, return default response
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured. Using default analysis.');
      return defaultResponse;
    }

    // Prepare the worksheet data and user answers for the AI prompt
    const worksheetTitle = worksheet.title || 'Untitled Worksheet';
    const worksheetDescription = worksheet.description || 'No description';
    
    // Format the user answers for the prompt
    const formattedAnswers = Object.entries(userAnswers)
      .map(([key, value]) => {
        // Find the question text if available
        const question = worksheet.fields?.find((field: any) => field.id === key);
        const questionText = question ? question.label : key;
        
        // Format the answer based on its type
        let formattedValue = value;
        if (Array.isArray(value)) {
          formattedValue = value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
          formattedValue = JSON.stringify(value);
        }
        
        return `Question: ${questionText}\nAnswer: ${formattedValue}`;
      })
      .filter(qa => qa && qa.includes('Answer:') && !qa.includes('Answer: undefined') && !qa.includes('Answer: null'))
      .join('\n\n');
      
    console.log(`[DEBUG] Formatted ${formattedAnswers.split('\n\n').length} answers for AI analysis`);
    
    if (!formattedAnswers || formattedAnswers.trim() === '') {
      console.log(`[DEBUG] No valid answers found for analysis`);
      return { challenges: [], analysis: 'No answers provided for analysis.' };
    }

    // Create the prompt for the AI
    const prompt = `
WORKSHEET INFORMATION:
Title: ${worksheetTitle}
Description: ${worksheetDescription}

USER RESPONSES:
${formattedAnswers}
`;

    // Call the OpenAI API using chat completions
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: 'system', content: CHALLENGE_ANALYSIS_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.5, // Lower temperature for more consistent results
    });

    // Parse the response
    const aiText = response.choices[0]?.message?.content?.trim() || '';
    
    try {
      // Extract the JSON part from the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]) as AIAnalysisResponse;
        return {
          challenges: jsonResponse.challenges || defaultResponse.challenges,
          analysis: jsonResponse.analysis || defaultResponse.analysis
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }
    
    // Fallback to default if parsing fails
    return defaultResponse;
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return {
      challenges: ['leadership', 'communication', 'goal-setting'],
      analysis: 'Based on the worksheet responses, the user may benefit from additional guidance in leadership development, communication skills, and goal setting.'
    };
  }
}

/**
 * Generates a personalized explanation for why a worksheet is recommended
 * 
 * @param sourceWorksheet The worksheet the user completed
 * @param targetWorksheet The worksheet being recommended
 * @param userChallenges The challenges identified from user's answers
 * @returns Personalized explanation string
 */
export async function generateRecommendationContext(
  sourceWorksheet: any,
  targetWorksheet: any,
  userChallenges: string[]
): Promise<string> {
  // Default context in case generation fails
  const defaultContext = `This worksheet builds on concepts from "${sourceWorksheet.title}" and addresses key leadership challenges.`;
  
  try {
    // If no OpenAI API key is configured, return default context
    if (!process.env.OPENAI_API_KEY) {
      return defaultContext;
    }

    // Create the prompt for the AI
    const prompt = `
SOURCE WORKSHEET:
Title: ${sourceWorksheet.title}
Description: ${sourceWorksheet.description || 'No description'}

TARGET WORKSHEET:
Title: ${targetWorksheet.title}
Description: ${targetWorksheet.description || 'No description'}

USER CHALLENGES:
${userChallenges.join(', ')}
`;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: 'system', content: RECOMMENDATION_CONTEXT_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    // Get the response text
    const contextText = response.choices[0]?.message?.content?.trim();
    
    return contextText || defaultContext;
  } catch (error) {
    console.error('Error generating recommendation context:', error);
    return defaultContext;
  }
}
