/**
 * Web application initialization module
 * This file runs initialization code for the web application
 * It should be imported by critical web components
 */

import { validateWebEnvironment } from '../utils/validateEnv';

/**
 * Initialize the web application
 * Validates environment variables and performs other initialization tasks
 */
export function initializeWebApp(): void {
  // Only validate in production to avoid development hassles
  if (process.env.NODE_ENV === 'production') {
    try {
      validateWebEnvironment();
    } catch (error: unknown) {
      // Properly type the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Environment validation failed: ${errorMessage}`);
      
      // In production, we want to fail fast if environment is not properly configured
      throw error;
    }
  }
  
  console.log(`🚀 Web application initialization complete (${process.env.NODE_ENV} mode)`);
}

// Run initialization when this module is imported
initializeWebApp();
