import OpenAI from 'openai';
import { openaiConfig, OpenAIModel } from '../config/openai';
import 'server-only'; // Ensure this module is never bundled for the client

/**
 * OpenAI Service
 * Handles communication with the OpenAI API for generating coaching feedback
 */

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
  organization: openaiConfig.organization,
  timeout: openaiConfig.timeout,
  maxRetries: openaiConfig.maxRetries,
});

// Interface for token usage tracking
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Interface for feedback generation options
export interface FeedbackOptions {
  model?: OpenAIModel;
  temperature?: number;
  maxTokens?: number;
}

// Default options for feedback generation
const defaultOptions: FeedbackOptions = {
  model: openaiConfig.defaultModel,
  temperature: 0.7, // Balanced between consistency and creativity
  maxTokens: 1000, // Default response length
};

/**
 * Generates coaching feedback based on worksheet responses
 * @param systemPrompt - The system prompt that defines the coaching style and context
 * @param userPrompt - The user's worksheet responses formatted as a prompt
 * @param options - Optional configuration for the API call
 * @returns The coaching feedback and token usage statistics
 */
export async function generateCoachingFeedback(
  systemPrompt: string,
  userPrompt: string,
  options: FeedbackOptions = {}
): Promise<{ feedback: string; tokenUsage: TokenUsage }> {
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    console.log(`Generating coaching feedback using model: ${mergedOptions.model}`);
    
    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: mergedOptions.model!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: mergedOptions.temperature,
      max_tokens: mergedOptions.maxTokens,
    });
    
    // Extract the feedback from the response
    const feedback = response.choices[0]?.message?.content || 'Unable to generate feedback at this time.';
    
    // Track token usage
    const tokenUsage: TokenUsage = {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    };
    
    console.log(`Feedback generated successfully. Total tokens used: ${tokenUsage.totalTokens}`);
    
    return { feedback, tokenUsage };
  } catch (error: any) {
    // Handle API errors with detailed logging
    console.error('Error generating coaching feedback:', error);
    
    // Provide more specific error messages based on the error type
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.status === 400) {
      throw new Error('Invalid request parameters. Please check your input.');
    } else if (error.status === 401) {
      throw new Error('Authentication error. Please check your API key.');
    } else {
      throw new Error(`Failed to generate coaching feedback: ${error.message}`);
    }
  }
}

/**
 * Estimates the number of tokens in a text string
 * This is a simple approximation - OpenAI's tokenization is more complex
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // A very rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Export the OpenAI client for advanced usage if needed
export { openai };
