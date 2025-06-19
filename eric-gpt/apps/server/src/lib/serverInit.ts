/**
 * Server initialization module
 * This file runs initialization code for the server application
 * It should be imported by critical server components
 */

import { validateServerEnvironment } from '../utils/validateEnv';

/**
 * Initialize the server application
 * Validates environment variables and performs other initialization tasks
 */
export function initializeServer(): void {
  // Only validate in production to avoid development hassles
  if (process.env.NODE_ENV === 'production') {
    try {
      validateServerEnvironment();
    } catch (error: unknown) {
      // Properly type the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Environment validation failed: ${errorMessage}`);
      
      // In production, we want to fail fast if environment is not properly configured
      throw error;
    }
  }
  
  console.log(`🚀 Server initialization complete (${process.env.NODE_ENV} mode)`);
}

// Run initialization when this module is imported
initializeServer();
