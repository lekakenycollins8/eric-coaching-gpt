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
  SOLO: {
    monthlySubmissions: 10, // Matches the limit in STRIPE_PLANS.SOLO_MONTHLY/YEARLY
    maxTokensPerRequest: 4000,
  },
  PRO: {
    monthlySubmissions: 40, // Matches the limit in STRIPE_PLANS.PRO_MONTHLY/YEARLY
    maxTokensPerRequest: 8000,
  },
  VIP: {
    monthlySubmissions: 999999, // Effectively unlimited, as in STRIPE_PLANS.VIP_MONTHLY/YEARLY
    maxTokensPerRequest: 16000,
  },
};

// Export types for TypeScript support
export type OpenAIModel = typeof OPENAI_MODELS[keyof typeof OPENAI_MODELS];
export type SubscriptionTier = keyof typeof QUOTA_LIMITS;
