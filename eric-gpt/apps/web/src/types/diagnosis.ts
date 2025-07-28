/**
 * Type definitions for diagnosis results from AI analysis
 */

/**
 * Structure for AI-generated diagnosis results
 */
export interface DiagnosisResult {
  summary: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  improvementScore?: number;
}

/**
 * Structure for diagnosis request parameters
 */
export interface DiagnosisRequest {
  content: string;
  context?: string;
  type: 'pillar' | 'workbook';
  pillarId?: string;
}

/**
 * Structure for diagnosis response from the API
 */
export interface DiagnosisResponse {
  diagnosis: DiagnosisResult;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
