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
    
    // Log what we're sending to OpenAI
    console.log(`Sending request to OpenAI with model: ${mergedOptions.model}, temperature: ${mergedOptions.temperature}, max_tokens: ${mergedOptions.maxTokens}`);
    
    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: mergedOptions.model!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: mergedOptions.temperature,
      max_tokens: mergedOptions.maxTokens, // OpenAI API expects snake_case parameter names
    });
    
    // Log a condensed version of the response to avoid cluttering logs
    console.log(`OpenAI response received - ID: ${response.id}, Model: ${response.model}, Finish reason: ${response.choices[0]?.finish_reason}`);
    console.log(`Token usage - Prompt: ${response.usage?.prompt_tokens}, Completion: ${response.usage?.completion_tokens}, Total: ${response.usage?.total_tokens}`);
    
    // In development, log the full response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Full OpenAI response:', JSON.stringify(response, null, 2));
    }
    
    // Extract the feedback from the response
    let feedback: string;
    const firstChoice = response.choices[0];
    
    if (firstChoice?.message?.tool_calls && firstChoice.message.tool_calls.length > 0) {
      // Handle tool calls if present (for future compatibility)
      console.log('Tool calls detected in response:', firstChoice.message.tool_calls);
      feedback = 'The AI suggested using tools to provide better feedback. This feature is not yet implemented.';
    } else {
      // Extract regular text content
      feedback = firstChoice?.message?.content || 'Unable to generate feedback at this time.';  
    }
    
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
