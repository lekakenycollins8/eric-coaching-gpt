/**
 * OpenAI Configuration
 * This file contains configuration settings for the OpenAI API integration.
 * All sensitive information is loaded from environment variables.
 */

// Define the available models
export const OPENAI_MODELS = {
  GPT_4: 'gpt-4o',
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
} as const;

// Define the default model to use
export const DEFAULT_MODEL = OPENAI_MODELS.GPT_4;

// Configuration object for OpenAI
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION_ID,
  defaultModel: DEFAULT_MODEL,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
};

// Validate the configuration at startup
export function validateOpenAIConfig() {
  if (!openaiConfig.apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  // Organization ID is optional, so we don't throw an error if it's missing
  if (!openaiConfig.organization) {
    console.warn('OPENAI_ORGANIZATION_ID environment variable is not set. This is optional but recommended for enterprise accounts.');
  }
  
  return true;
}

// Define quota limits based on subscription tiers
// These values should match the limits defined in the Stripe plans
export const QUOTA_LIMITS = {
  FOUNDATION: {
    monthlySubmissions: parseInt(process.env.QUOTA_LIMIT_FOUNDATION_SUBMISSIONS || '10'),
    maxTokensPerRequest: parseInt(process.env.QUOTA_LIMIT_FOUNDATION_TOKENS || '4000'),
  },
  MOMENTUM: {
    monthlySubmissions: parseInt(process.env.QUOTA_LIMIT_MOMENTUM_SUBMISSIONS || '25'),
    maxTokensPerRequest: parseInt(process.env.QUOTA_LIMIT_MOMENTUM_TOKENS || '8000'),
  },
  LEGACY: {
    monthlySubmissions: parseInt(process.env.QUOTA_LIMIT_LEGACY_SUBMISSIONS || '40'),
    maxTokensPerRequest: parseInt(process.env.QUOTA_LIMIT_LEGACY_TOKENS || '12000'),
  },
  EXECUTIVE: {
    // Default to a very high number if env var is not set
    monthlySubmissions: parseInt(process.env.QUOTA_LIMIT_EXECUTIVE_SUBMISSIONS || '999999'),
    maxTokensPerRequest: parseInt(process.env.QUOTA_LIMIT_EXECUTIVE_TOKENS || '16000'),
  },
};

// Export types for TypeScript support
export type OpenAIModel = typeof OPENAI_MODELS[keyof typeof OPENAI_MODELS];
export type SubscriptionTier = keyof typeof QUOTA_LIMITS;
