/**
 * Environment variable validation utility
 * Ensures all required environment variables are set before the application starts
 */

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variable is missing or has an invalid value
 */
export function validateWebEnvironment(): void {
  const requiredEnvVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'EMAIL_SERVER',
    'EMAIL_FROM'
  ];

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  // Special check for NEXTAUTH_SECRET to ensure it's not using the default value
  if (process.env.NEXTAUTH_SECRET === 'CHANGE_ME') {
    throw new Error('NEXTAUTH_SECRET is set to default value "CHANGE_ME". Please change it for production.');
  }

  // If any required variables are missing, throw an error with all missing variables
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate URL formats
  try {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      new URL(process.env.NEXT_PUBLIC_APP_URL);
    }
    if (process.env.NEXT_PUBLIC_API_URL) {
      new URL(process.env.NEXT_PUBLIC_API_URL);
    }
    if (process.env.NEXTAUTH_URL) {
      new URL(process.env.NEXTAUTH_URL);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid URL format in environment variables: ${errorMessage}`);
  }

  console.log('✅ Environment validation passed');
}
