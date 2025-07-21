import { openai } from '@/services/openai';
import { openaiConfig } from '@/config/openai';
import { DIAGNOSIS_PROMPT, DIAGNOSIS_SYSTEM_MESSAGE } from '@/config/prompts/diagnosis';
import { FollowupType, PillarType, WorksheetType } from './followupUtils';

/**
 * Interface for formatted question-answer pairs
 */
export interface FormattedQA {
  question: string;
  answer: string;
}

/**
 * Interface for the parsed diagnosis response
 */
export interface DiagnosisResponse {
  summary: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  followupWorksheets: {
    pillars: PillarType[];
  };
}

/**
 * Generates an AI diagnosis based on workbook answers
 * @param formattedAnswers Array of question-answer pairs
 * @param clientName Name of the client
 * @returns Structured diagnosis object
 */
export async function generateAIDiagnosis(
  formattedAnswers: FormattedQA[],
  clientName: string
): Promise<DiagnosisResponse> {
  // Generate the prompt using the template from config
  const prompt = DIAGNOSIS_PROMPT
    .replace('{{clientName}}', clientName)
    .replace('{{formattedAnswers}}', 
      formattedAnswers.map(qa => `Question: ${qa.question}\nAnswer: ${qa.answer}\n`).join('\n')
    );

  try {
    console.log('Generating diagnosis for client:', clientName);
    
    // Call OpenAI API using the service
    const completion = await openai.chat.completions.create({
      model: openaiConfig.defaultModel,
      messages: [
        { role: 'system', content: DIAGNOSIS_SYSTEM_MESSAGE },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    console.log(`Diagnosis generated successfully. Model: ${completion.model}, Tokens used: ${completion.usage?.total_tokens || 0}`);
    
    const diagnosisText = completion.choices[0]?.message?.content || '';
    
    // Parse the AI response into structured diagnosis
    return parseDiagnosisResponse(diagnosisText);
  } catch (error: any) {
    console.error('Error generating diagnosis:', error);
    throw new Error(`Failed to generate diagnosis: ${error.message}`);
  }
}

/**
 * Parses the AI response into a structured diagnosis object
 * @param diagnosisText Raw text response from AI
 * @returns Structured diagnosis object
 */
export function parseDiagnosisResponse(diagnosisText: string): DiagnosisResponse {
  // This is a simplified parser - in a real implementation,
  // you might want to use more robust parsing or have the AI
  // return structured data directly
  
  const sections = diagnosisText.split(/\n\s*\n/);
  
  let summary = '';
  const strengths: string[] = [];
  const challenges: string[] = [];
  const recommendations: string[] = [];
  const pillars: PillarType[] = [];
  
  sections.forEach(section => {
    if (section.toLowerCase().includes('summary') || section.toLowerCase().includes('situation')) {
      summary = section.replace(/^.*summary.*?:/i, '').trim();
    } else if (section.toLowerCase().includes('strength')) {
      const items = section.split(/\n/).filter(line => line.match(/^\d+\.\s+/));
      items.forEach(item => strengths.push(item.replace(/^\d+\.\s+/, '').trim()));
    } else if (section.toLowerCase().includes('challenge') || section.toLowerCase().includes('growth area')) {
      const items = section.split(/\n/).filter(line => line.match(/^\d+\.\s+/));
      items.forEach(item => challenges.push(item.replace(/^\d+\.\s+/, '').trim()));
    } else if (section.toLowerCase().includes('recommendation')) {
      const items = section.split(/\n/).filter(line => line.match(/^\d+\.\s+/));
      items.forEach(item => recommendations.push(item.replace(/^\d+\.\s+/, '').trim()));
    } else if (section.toLowerCase().includes('follow-up worksheet') || section.toLowerCase().includes('pillar')) {
      // Extract pillar IDs
      extractPillarIds(section, pillars);
    }
  });
  
  return {
    summary,
    strengths,
    challenges,
    recommendations,
    followupWorksheets: {
      pillars
    }
  };
}

/**
 * Extract pillar IDs from the diagnosis text
 * @param text Text to extract pillar IDs from
 * @param pillars Array to add extracted pillar IDs to
 */
function extractPillarIds(text: string, pillars: PillarType[]): void {
  // Check for exact pillar IDs
  const pillarMatches = text.match(/pillar\d+_[a-z_]+/gi) || [];
  
  pillarMatches.forEach(match => {
    const pillarId = match.toLowerCase() as PillarType;
    if (!pillars.includes(pillarId)) {
      pillars.push(pillarId);
    }
  });
  
  // If no exact matches, try keyword matching
  if (pillars.length === 0) {
    if (text.toLowerCase().includes('leadership mindset')) {
      pillars.push('pillar1_leadership_mindset');
    }
    if (text.toLowerCase().includes('goal setting')) {
      pillars.push('pillar2_goal_setting');
    }
    if (text.toLowerCase().includes('communication')) {
      pillars.push('pillar3_communication_mastery');
    }
    if (text.toLowerCase().includes('time mastery')) {
      pillars.push('pillar4_time_mastery');
    }
    if (text.toLowerCase().includes('strategic thinking')) {
      pillars.push('pillar5_strategic_thinking');
    }
    if (text.toLowerCase().includes('emotional intelligence')) {
      pillars.push('pillar6_emotional_intelligence');
    }
    if (text.toLowerCase().includes('delegation')) {
      pillars.push('pillar7_delegation_empowerment');
    }
    if (text.toLowerCase().includes('change') || text.toLowerCase().includes('uncertainty')) {
      pillars.push('pillar8_change_uncertainty');
    }
    if (text.toLowerCase().includes('conflict')) {
      pillars.push('pillar9_conflict_resolution');
    }
    if (text.toLowerCase().includes('high performance')) {
      pillars.push('pillar10_high_performance');
    }
    if (text.toLowerCase().includes('decision making')) {
      pillars.push('pillar11_decision_making');
    }
    if (text.toLowerCase().includes('execution') || text.toLowerCase().includes('results')) {
      pillars.push('pillar12_execution_results');
    }
  }
}

/**
 * Extract follow-up worksheet ID from the diagnosis text
 * @param text Text to extract follow-up ID from
 * @returns Follow-up worksheet ID or null if not found
 */
function extractFollowupId(text: string): FollowupType | null {
  // Check for exact follow-up IDs
  if (text.includes('followup-1') || text.toLowerCase().includes('ask the right questions')) {
    return 'followup-1';
  }
  if (text.includes('followup-2') || text.toLowerCase().includes('identify the issues')) {
    return 'followup-2';
  }
  if (text.includes('followup-3') || text.toLowerCase().includes('find the best solution')) {
    return 'followup-3';
  }
  if (text.includes('followup-4') || text.toLowerCase().includes('execute and succeed')) {
    return 'followup-4';
  }
  
  return null;
}

/**
 * Determines the most appropriate follow-up worksheets based on the diagnosis
 * @param diagnosis Structured diagnosis object
 * @returns Object containing recommended pillar worksheets
 */
export function determineFollowupWorksheets(diagnosis: DiagnosisResponse): {
  pillars: PillarType[];
} {
  // Start with any explicitly identified pillars from the AI response
  let pillars = [...(diagnosis.followupWorksheets.pillars || [])];
  
  // If we don't have enough pillars, supplement with content-based analysis
  if (pillars.length < 3) {
    const contentBasedPillars = determineDefaultPillars(diagnosis);
    
    // Add content-based pillars that aren't already included
    for (const pillar of contentBasedPillars) {
      if (!pillars.includes(pillar) && pillars.length < 3) {
        pillars.push(pillar);
      }
    }
  }
  
  // If we still don't have any pillars, use the defaults
  if (pillars.length === 0) {
    pillars = ['pillar1_leadership_mindset', 'pillar3_communication_mastery', 'pillar7_delegation_empowerment'];
  }
  
  // Prioritize pillars based on the diagnosis content
  pillars = prioritizePillars(pillars, diagnosis);
  
  return {
    pillars: pillars.slice(0, 3) // Limit to 3 pillars max
  };
}

/**
 * Prioritizes pillar worksheets based on relevance to the diagnosis
 * @param pillars Array of pillar IDs
 * @param diagnosis Structured diagnosis object
 * @returns Prioritized array of pillar IDs
 */
function prioritizePillars(pillars: PillarType[], diagnosis: DiagnosisResponse): PillarType[] {
  // Create a map of pillar IDs to their relevance scores
  const pillarScores: Record<string, number> = {};
  
  // Initialize scores for all pillars
  pillars.forEach(pillar => {
    pillarScores[pillar] = 0;
  });
  
  // Combine all text from the diagnosis for analysis
  const allText = [
    diagnosis.summary,
    ...diagnosis.strengths,
    ...diagnosis.challenges,
    ...diagnosis.recommendations
  ].join(' ').toLowerCase();
  
  // Define keywords for each pillar
  const pillarKeywords: Record<string, string[]> = {
    'pillar1_leadership_mindset': ['mindset', 'confidence', 'belief', 'attitude', 'perspective', 'self-doubt'],
    'pillar2_goal_setting': ['goal', 'objective', 'target', 'aspiration', 'achievement', 'milestone'],
    'pillar3_communication_mastery': ['communicat', 'listen', 'express', 'articulate', 'message', 'dialogue'],
    'pillar4_time_mastery': ['time', 'schedule', 'priorit', 'deadline', 'efficiency', 'procrastination'],
    'pillar5_strategic_thinking': ['strateg', 'vision', 'plan', 'foresight', 'big picture', 'direction'],
    'pillar6_emotional_intelligence': ['emotion', 'empath', 'self-aware', 'feeling', 'interpersonal', 'social'],
    'pillar7_delegation_empowerment': ['delegat', 'micromanag', 'trust', 'empower', 'responsibility', 'control'],
    'pillar8_change_uncertainty': ['change', 'adapt', 'uncertain', 'flexible', 'resilient', 'transition'],
    'pillar9_conflict_resolution': ['conflict', 'disagree', 'tension', 'resolution', 'mediate', 'harmony'],
    'pillar10_high_performance': ['perform', 'excel', 'achieve', 'productivity', 'efficiency', 'results'],
    'pillar11_decision_making': ['decision', 'choice', 'judg', 'evaluate', 'option', 'analysis'],
    'pillar12_execution_results': ['execut', 'result', 'implement', 'action', 'deliver', 'outcome']
  };
  
  // Score each pillar based on keyword matches
  pillars.forEach(pillar => {
    const keywords = pillarKeywords[pillar] || [];
    keywords.forEach(keyword => {
      // Count occurrences of the keyword in the diagnosis text
      const regex = new RegExp(keyword, 'gi');
      const matches = allText.match(regex);
      if (matches) {
        pillarScores[pillar] += matches.length;
      }
    });
    
    // Add extra weight for explicit mentions in recommendations
    diagnosis.recommendations.forEach(rec => {
      const pillarName = pillar.replace('pillar', '').replace('_', ' ').toLowerCase();
      if (rec.toLowerCase().includes(pillarName)) {
        pillarScores[pillar] += 5;
      }
    });
  });
  
  // Sort pillars by score (descending)
  return pillars.sort((a, b) => pillarScores[b] - pillarScores[a]);
}

/**
 * Determines default pillar worksheets based on the diagnosis content
 * @param diagnosis Structured diagnosis object
 * @returns Array of pillar IDs
 */
function determineDefaultPillars(diagnosis: DiagnosisResponse): PillarType[] {
  const pillars: PillarType[] = [];
  const allText = [
    diagnosis.summary,
    ...diagnosis.challenges,
    ...diagnosis.recommendations
  ].join(' ').toLowerCase();
  
  // Simple keyword matching
  if (allText.includes('mindset') || allText.includes('confidence') || allText.includes('belief')) {
    pillars.push('pillar1_leadership_mindset');
  }
  if (allText.includes('goal') || allText.includes('objective') || allText.includes('target')) {
    pillars.push('pillar2_goal_setting');
  }
  if (allText.includes('communicat') || allText.includes('listen') || allText.includes('express')) {
    pillars.push('pillar3_communication_mastery');
  }
  if (allText.includes('time') || allText.includes('schedule') || allText.includes('priorit')) {
    pillars.push('pillar4_time_mastery');
  }
  if (allText.includes('strateg') || allText.includes('vision') || allText.includes('plan')) {
    pillars.push('pillar5_strategic_thinking');
  }
  if (allText.includes('emotion') || allText.includes('empath') || allText.includes('self-aware')) {
    pillars.push('pillar6_emotional_intelligence');
  }
  if (allText.includes('delegat') || allText.includes('micromanag') || allText.includes('trust')) {
    pillars.push('pillar7_delegation_empowerment');
  }
  if (allText.includes('change') || allText.includes('adapt') || allText.includes('uncertain')) {
    pillars.push('pillar8_change_uncertainty');
  }
  if (allText.includes('conflict') || allText.includes('disagree') || allText.includes('tension')) {
    pillars.push('pillar9_conflict_resolution');
  }
  if (allText.includes('perform') || allText.includes('excel') || allText.includes('achieve')) {
    pillars.push('pillar10_high_performance');
  }
  if (allText.includes('decision') || allText.includes('choice') || allText.includes('judg')) {
    pillars.push('pillar11_decision_making');
  }
  if (allText.includes('execut') || allText.includes('result') || allText.includes('implement')) {
    pillars.push('pillar12_execution_results');
  }
  
  // If no matches, default to leadership mindset and communication
  if (pillars.length === 0) {
    pillars.push('pillar1_leadership_mindset');
    pillars.push('pillar3_communication_mastery');
  }
  
  return pillars.slice(0, 3); // Limit to 3 pillars max
}

/**
 * Determines default follow-up worksheet based on the diagnosis content
 * @param diagnosis Structured diagnosis object
 * @returns Follow-up worksheet ID
 */
function determineDefaultFollowup(diagnosis: DiagnosisResponse): FollowupType {
  const allText = [
    diagnosis.summary,
    ...diagnosis.challenges,
    ...diagnosis.recommendations
  ].join(' ').toLowerCase();
  
  // Simple keyword matching for follow-up worksheets
  if (allText.includes('question') || allText.includes('ask') || allText.includes('inquir')) {
    return 'followup-1'; // Ask the Right Questions
  }
  if (allText.includes('issue') || allText.includes('problem') || allText.includes('identif')) {
    return 'followup-2'; // Identify the Issues
  }
  if (allText.includes('solution') || allText.includes('solve') || allText.includes('best approach')) {
    return 'followup-3'; // Find the Best Solution
  }
  if (allText.includes('execut') || allText.includes('implement') || allText.includes('succeed')) {
    return 'followup-4'; // Execute and Succeed
  }
  
  // Default to the first follow-up worksheet
  return 'followup-1';
}
