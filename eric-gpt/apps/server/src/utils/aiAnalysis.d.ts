import { IUser } from '../models/User';

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
export function analyzeUserChallenges(
  worksheet: any,
  userAnswers: Record<string, any>,
  user?: IUser
): Promise<AIAnalysisResponse>;

/**
 * Generates a personalized explanation for why a worksheet is recommended
 * 
 * @param sourceWorksheet The worksheet the user completed
 * @param targetWorksheet The worksheet being recommended
 * @param userChallenges The challenges identified from user's answers
 * @returns Personalized explanation string
 */
export function generateRecommendationContext(
  sourceWorksheet: any,
  targetWorksheet: any,
  userChallenges: string[]
): Promise<string>;
