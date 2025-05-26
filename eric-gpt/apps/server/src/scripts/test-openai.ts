/**
 * Test script for OpenAI integration
 * This script tests the OpenAI service by generating coaching feedback for a sample worksheet
 * 
 * Usage: 
 * 1. Set OPENAI_API_KEY in .env.local
 * 2. Run: npx ts-node -r dotenv/config src/scripts/test-openai.ts
 */

import { generateCoachingFeedback } from '../services/openai';
import { getSystemPromptForWorksheet, formatUserPrompt } from '../config/prompts';
import { validateOpenAIConfig } from '../config/openai';

// Sample worksheet data
const sampleWorksheet = {
  id: 'pillar1_leadership_mindset',
  title: 'Leadership Mindset Assessment',
  answers: {
    leadershipStrengths: 'Strategic thinking, empathy, and the ability to inspire others.',
    biggestChallenges: 'Delegating effectively and managing conflict within the team.',
    leadershipValues: 'Integrity, innovation, and empowering others to succeed.',
    successDefinition: 'Creating a positive impact while achieving business goals and developing my team members.',
    growthAreas: 'Improving my public speaking skills and becoming more comfortable with difficult conversations.',
  }
};

async function runTest() {
  try {
    console.log('Testing OpenAI integration...');
    
    // Validate the OpenAI configuration
    validateOpenAIConfig();
    
    // Get the system prompt for this worksheet
    const systemPrompt = getSystemPromptForWorksheet(sampleWorksheet.id);
    
    // Format the user's answers into a prompt
    const userPrompt = formatUserPrompt(sampleWorksheet.title, sampleWorksheet.answers);
    
    console.log('\nSystem Prompt (first 100 chars):', systemPrompt.substring(0, 100) + '...');
    console.log('\nUser Prompt (first 100 chars):', userPrompt.substring(0, 100) + '...');
    
    console.log('\nGenerating coaching feedback...');
    
    // Generate coaching feedback using OpenAI
    const { feedback, tokenUsage } = await generateCoachingFeedback(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    console.log('\n--- Coaching Feedback ---\n');
    console.log(feedback);
    console.log('\n--- Token Usage ---');
    console.log(`Prompt tokens: ${tokenUsage.promptTokens}`);
    console.log(`Completion tokens: ${tokenUsage.completionTokens}`);
    console.log(`Total tokens: ${tokenUsage.totalTokens}`);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest();
