import { DiagnosisResponse } from './interfaces';
import { FollowupType, PillarType, WorksheetType, PILLAR_TYPES, FOLLOWUP_TYPES } from '../followupUtils';

/**
 * Determines the most appropriate follow-up worksheets based on the diagnosis
 * @param diagnosis Structured diagnosis object
 * @param previousSubmissions Optional previous submissions for context
 * @returns Object containing recommended pillar worksheets
 */
export function determineFollowupWorksheets(
  diagnosis: DiagnosisResponse,
  previousSubmissions?: {
    worksheetId: WorksheetType;
    submissionDate: Date;
    score?: number;
  }[]
): {
  pillars: PillarType[];
} {
  // Extract pillar IDs from the diagnosis text
  const pillars = diagnosis.followupWorksheets.pillars;
  
  // If we have explicit pillar recommendations from the enhanced diagnosis, use those
  if (diagnosis.pillarRecommendations && diagnosis.pillarRecommendations.length > 0) {
    return {
      pillars: diagnosis.pillarRecommendations.map(rec => rec.id).slice(0, 3)
    };
  }
  
  // If we have explicit pillar recommendations from the basic diagnosis, use those
  if (pillars.length > 0) {
    // Prioritize the pillars based on relevance to the diagnosis
    const prioritizedPillars = prioritizePillars(pillars, diagnosis, previousSubmissions);
    
    // Return the top 3 pillars
    return {
      pillars: prioritizedPillars.slice(0, 3)
    };
  }
  
  // If no explicit pillar recommendations, determine default pillars
  const defaultPillars = determineDefaultPillars(diagnosis, previousSubmissions);
  
  return {
    pillars: defaultPillars
  };
}

/**
 * Prioritizes pillar worksheets based on relevance to the diagnosis
 * @param pillars Array of pillar IDs
 * @param diagnosis Structured diagnosis object
 * @param previousSubmissions Optional previous submissions for context
 * @returns Prioritized array of pillar IDs
 */
function prioritizePillars(
  pillars: PillarType[], 
  diagnosis: DiagnosisResponse,
  previousSubmissions?: {
    worksheetId: WorksheetType;
    submissionDate: Date;
    score?: number;
  }[]
): PillarType[] {
  // Create a score for each pillar
  const pillarScores: Record<PillarType, number> = {} as Record<PillarType, number>;
  
  // Initialize scores
  pillars.forEach(pillar => {
    pillarScores[pillar] = 0;
  });
  
  // Score based on mentions in the diagnosis text
  pillars.forEach(pillar => {
    // Convert pillar ID to readable name for matching
    const pillarName = pillar
      .replace('pillar', '')
      .replace(/^\\d+_/, '')
      .replace(/_/g, ' ')
      .toLowerCase();
    
    // Check for mentions in the summary
    if (diagnosis.summary.toLowerCase().includes(pillarName)) {
      pillarScores[pillar] += 3;
    }
    
    // Check for mentions in challenges
    diagnosis.challenges.forEach(challenge => {
      if (challenge.toLowerCase().includes(pillarName)) {
        pillarScores[pillar] += 2;
      }
    });
    
    // Add extra weight for explicit mentions in recommendations
    diagnosis.recommendations.forEach(rec => {
      if (rec.toLowerCase().includes(pillarName)) {
        pillarScores[pillar] += 5;
      }
    });
    
    // Enhanced scoring using the detailed analysis
    if (diagnosis.situationAnalysis?.fullText) {
      if (diagnosis.situationAnalysis.fullText.toLowerCase().includes(pillarName)) {
        pillarScores[pillar] += 2;
      }
    }
    
    // Score based on growth areas
    if (diagnosis.growthAreasAnalysis) {
      diagnosis.growthAreasAnalysis.forEach(area => {
        if (area.area.toLowerCase().includes(pillarName) || 
            area.rootCause.toLowerCase().includes(pillarName)) {
          pillarScores[pillar] += 4;
        }
      });
    }
    
    // Score based on actionable recommendations
    if (diagnosis.actionableRecommendations) {
      diagnosis.actionableRecommendations.forEach(rec => {
        if (rec.action.toLowerCase().includes(pillarName) || 
            rec.implementation.toLowerCase().includes(pillarName)) {
          pillarScores[pillar] += 3;
        }
      });
    }
  });
  
  // Consider previous submissions if available
  if (previousSubmissions && previousSubmissions.length > 0) {
    // Reduce score for pillars that have been recently completed
    previousSubmissions.forEach(sub => {
      const worksheetId = sub.worksheetId;
      if (PILLAR_TYPES.includes(worksheetId as any)) {
        const pillarId = worksheetId as PillarType;
        if (pillarScores[pillarId] !== undefined) {
          // Reduce score based on how recently it was completed
          const daysSinceSubmission = Math.floor(
            (Date.now() - sub.submissionDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // If completed within the last 30 days, reduce score
          if (daysSinceSubmission < 30) {
            pillarScores[pillarId] -= Math.max(0, 10 - Math.floor(daysSinceSubmission / 3));
          }
          
          // If the user scored well on this pillar, reduce score further
          if (sub.score !== undefined && sub.score > 7) {
            pillarScores[pillarId] -= 5;
          }
        }
      }
    });
  }
  
  // Sort pillars by score (descending)
  return pillars.sort((a, b) => pillarScores[b] - pillarScores[a]);
}

/**
 * Determines default pillar worksheets based on the diagnosis content
 * @param diagnosis Structured diagnosis object
 * @param previousSubmissions Optional previous submissions for context
 * @returns Array of pillar IDs
 */
function determineDefaultPillars(
  diagnosis: DiagnosisResponse,
  previousSubmissions?: {
    worksheetId: WorksheetType;
    submissionDate: Date;
    score?: number;
  }[]
): PillarType[] {
  // Create a score for each pillar
  const pillarScores: Record<PillarType, number> = {} as Record<PillarType, number>;
  
  // Initialize scores for all pillars
  PILLAR_TYPES.forEach(pillar => {
    pillarScores[pillar] = 0;
  });
  
  // Combine all text from the diagnosis for analysis
  const allText = [
    diagnosis.summary,
    ...diagnosis.challenges,
    ...diagnosis.recommendations,
    diagnosis.situationAnalysis?.fullText || ''
  ].join(' ').toLowerCase();
  
  // Enhanced keyword matching with weighted scoring
  const keywordMap: Record<PillarType, string[]> = {
    'pillar1_leadership_mindset': ['mindset', 'confidence', 'belief', 'self-doubt', 'impostor syndrome', 'leadership identity'],
    'pillar2_goal_setting': ['goal', 'objective', 'target', 'vision', 'milestone', 'smart goals', 'planning'],
    'pillar3_communication_mastery': ['communicat', 'listen', 'express', 'articulate', 'message', 'feedback', 'clarity'],
    'pillar4_time_mastery': ['time', 'schedule', 'priorit', 'procrastination', 'deadline', 'efficiency', 'productivity'],
    'pillar5_strategic_thinking': ['strateg', 'vision', 'plan', 'big picture', 'long-term', 'direction', 'foresight'],
    'pillar6_emotional_intelligence': ['emotion', 'empath', 'self-aware', 'social awareness', 'relationship', 'eq', 'feeling'],
    'pillar7_delegation_empowerment': ['delegat', 'micromanag', 'trust', 'empower', 'team development', 'letting go', 'control'],
    'pillar8_change_uncertainty': ['change', 'adapt', 'uncertain', 'flexibility', 'resilience', 'agility', 'transformation'],
    'pillar9_conflict_resolution': ['conflict', 'disagree', 'tension', 'resolution', 'mediation', 'difficult conversation', 'harmony'],
    'pillar10_high_performance': ['perform', 'excel', 'achieve', 'results', 'success', 'standards', 'excellence'],
    'pillar11_decision_making': ['decision', 'choice', 'judg', 'analysis', 'options', 'evaluate', 'determine'],
    'pillar12_execution_results': ['execut', 'result', 'implement', 'action', 'follow-through', 'accountability', 'outcome']
  };
  
  // Score each pillar based on keyword matches
  Object.entries(keywordMap).forEach(([pillar, keywords]) => {
    keywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        pillarScores[pillar as PillarType] += 2;
        
        // Add extra weight for keywords in challenges and recommendations
        diagnosis.challenges.forEach(challenge => {
          if (challenge.toLowerCase().includes(keyword)) {
            pillarScores[pillar as PillarType] += 1;
          }
        });
        
        diagnosis.recommendations.forEach(rec => {
          if (rec.toLowerCase().includes(keyword)) {
            pillarScores[pillar as PillarType] += 2;
          }
        });
      }
    });
  });
  
  // Enhanced scoring using the detailed analysis
  if (diagnosis.growthAreasAnalysis) {
    diagnosis.growthAreasAnalysis.forEach(area => {
      Object.entries(keywordMap).forEach(([pillar, keywords]) => {
        keywords.forEach(keyword => {
          if (area.area.toLowerCase().includes(keyword) || 
              area.rootCause.toLowerCase().includes(keyword)) {
            pillarScores[pillar as PillarType] += 3;
          }
        });
      });
    });
  }
  
  // Consider previous submissions if available
  if (previousSubmissions && previousSubmissions.length > 0) {
    // Reduce score for pillars that have been recently completed
    previousSubmissions.forEach(sub => {
      const worksheetId = sub.worksheetId;
      if (PILLAR_TYPES.includes(worksheetId as any)) {
        const pillarId = worksheetId as PillarType;
        
        // Reduce score based on how recently it was completed
        const daysSinceSubmission = Math.floor(
          (Date.now() - sub.submissionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // If completed within the last 30 days, reduce score
        if (daysSinceSubmission < 30) {
          pillarScores[pillarId] -= Math.max(0, 10 - Math.floor(daysSinceSubmission / 3));
        }
        
        // If the user scored well on this pillar, reduce score further
        if (sub.score !== undefined && sub.score > 7) {
          pillarScores[pillarId] -= 5;
        }
      }
    });
  }
  
  // Convert scores to array of pillars and sort by score
  const sortedPillars = Object.entries(pillarScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([pillar]) => pillar as PillarType);
  
  // If no strong matches, default to leadership mindset and communication
  if (sortedPillars.length === 0 || pillarScores[sortedPillars[0]] < 2) {
    return ['pillar1_leadership_mindset', 'pillar3_communication_mastery', 'pillar10_high_performance'];
  }
  
  return sortedPillars.slice(0, 3); // Limit to 3 pillars max
}

/**
 * Determines default follow-up worksheet based on the diagnosis content
 * @param diagnosis Structured diagnosis object
 * @returns Follow-up worksheet ID
 */
export function determineDefaultFollowup(diagnosis: DiagnosisResponse): FollowupType {
  // If we have an explicit follow-up recommendation from the enhanced diagnosis, use it
  if (diagnosis.followupRecommendation) {
    return diagnosis.followupRecommendation.id;
  }
  
  // Create a score for each follow-up worksheet
  const followupScores: Record<FollowupType, number> = {} as Record<FollowupType, number>;
  
  // Initialize scores
  FOLLOWUP_TYPES.forEach(followup => {
    followupScores[followup] = 0;
  });
  
  // Combine all text from the diagnosis for analysis
  const allText = [
    diagnosis.summary,
    ...diagnosis.challenges,
    ...diagnosis.recommendations,
    diagnosis.situationAnalysis?.fullText || ''
  ].join(' ').toLowerCase();
  
  // Enhanced keyword matching with weighted scoring
  const keywordMap: Record<FollowupType, string[]> = {
    'followup-1': ['question', 'ask', 'inquir', 'clarify', 'understand', 'explore', 'discover'],
    'followup-2': ['issue', 'problem', 'identif', 'challenge', 'obstacle', 'barrier', 'diagnose'],
    'followup-3': ['solution', 'solve', 'best approach', 'alternative', 'option', 'strategy', 'resolve'],
    'followup-4': ['execut', 'implement', 'succeed', 'action', 'accomplish', 'achieve', 'complete']
  };
  
  // Score each follow-up based on keyword matches
  Object.entries(keywordMap).forEach(([followup, keywords]) => {
    keywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        followupScores[followup as FollowupType] += 2;
        
        // Add extra weight for keywords in challenges and recommendations
        diagnosis.challenges.forEach(challenge => {
          if (challenge.toLowerCase().includes(keyword)) {
            followupScores[followup as FollowupType] += 1;
          }
        });
        
        diagnosis.recommendations.forEach(rec => {
          if (rec.toLowerCase().includes(keyword)) {
            followupScores[followup as FollowupType] += 2;
          }
        });
      }
    });
  });
  
  // Enhanced scoring using the detailed analysis
  if (diagnosis.growthAreasAnalysis) {
    diagnosis.growthAreasAnalysis.forEach(area => {
      Object.entries(keywordMap).forEach(([followup, keywords]) => {
        keywords.forEach(keyword => {
          if (area.area.toLowerCase().includes(keyword) || 
              area.rootCause.toLowerCase().includes(keyword)) {
            followupScores[followup as FollowupType] += 3;
          }
        });
      });
    });
  }
  
  if (diagnosis.actionableRecommendations) {
    diagnosis.actionableRecommendations.forEach(rec => {
      // If recommendations focus on identifying problems
      if (rec.action.toLowerCase().includes('identif') || 
          rec.action.toLowerCase().includes('assess') || 
          rec.action.toLowerCase().includes('evaluat')) {
        followupScores['followup-2'] += 2;
      }
      
      // If recommendations focus on implementing solutions
      if (rec.action.toLowerCase().includes('implement') || 
          rec.action.toLowerCase().includes('execut') || 
          rec.action.toLowerCase().includes('apply')) {
        followupScores['followup-4'] += 2;
      }
    });
  }
  
  // Get the follow-up with the highest score
  const sortedFollowups = Object.entries(followupScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([followup]) => followup as FollowupType);
  
  // If no strong matches, default to the first follow-up worksheet
  if (sortedFollowups.length === 0 || followupScores[sortedFollowups[0]] < 2) {
    return 'followup-1';
  }
  
  return sortedFollowups[0];
}
