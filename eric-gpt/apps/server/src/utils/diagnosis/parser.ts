import { 
  ActionableRecommendation, 
  DiagnosisResponse, 
  FollowupRecommendation, 
  GrowthAreaAnalysis, 
  PillarRecommendation, 
  StrengthAnalysis 
} from './interfaces';
import { FollowupType, PillarType } from '../followupUtils';

/**
 * Parses the AI response into a structured diagnosis object
 * @param diagnosisText Raw text response from AI
 * @returns Structured diagnosis object
 */
export function parseDiagnosisResponse(diagnosisText: string): DiagnosisResponse {
  // Log the raw diagnosis text for debugging
  console.log('Parsing diagnosis text of length:', diagnosisText.length);
  console.log('First 200 characters:', diagnosisText.substring(0, 200));
  
  // Extract sections by markdown headings (both ## and # are supported)
  const sections: Record<string, string> = {};
  let currentSection = '';
  let currentContent: string[] = [];
  
  // First pass: extract all sections with their exact headings
  diagnosisText.split('\n').forEach(line => {
    if (line.startsWith('## ') || line.startsWith('# ')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
        currentContent = [];
      }
      currentSection = line.replace(/^#+\s+/, '').trim();
    } else if (currentSection) {
      currentContent.push(line);
    }
  });
  
  // Add the last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  // Log all section headings found
  console.log('Sections found:', Object.keys(sections));
  
  // Map of possible section headings to standardized names
  const sectionMappings: Record<string, string[]> = {
    'Summary': ['summary', 'overview', 'executive summary'],
    'Leadership Situation Analysis': ['leadership situation analysis', 'situation analysis', 'context', 'current situation'],
    'Strengths': ['key strengths', 'strengths', 'leadership strengths'],
    'Growth Areas': ['growth areas', 'challenges', 'areas for improvement', 'development areas', 'weaknesses'],
    'Actionable Recommendations': ['actionable recommendations', 'recommendations', 'action items', 'action steps', 'next steps'],
    'Recommended Leadership Pillars': ['recommended leadership pillars', 'leadership pillars', 'pillar recommendations', 'pillars'],
    'Implementation Support': ['implementation support', 'follow-up', 'follow up', 'followup', 'implementation']
  };
  
  // Second pass: normalize section names
  const normalizedSections: Record<string, string> = {};
  for (const [standardName, variations] of Object.entries(sectionMappings)) {
    for (const [sectionName, content] of Object.entries(sections)) {
      if (variations.includes(sectionName.toLowerCase())) {
        normalizedSections[standardName] = content;
        break;
      }
    }
  }
  
  // Log normalized sections
  console.log('Normalized sections:', Object.keys(normalizedSections));
  
  // Extract basic information for backward compatibility
  const summary = normalizedSections['Summary'] || normalizedSections['Leadership Situation Analysis'] || 'No summary provided.';
  const strengths = extractListItems(normalizedSections['Strengths'] || '');
  const challenges = extractListItems(normalizedSections['Growth Areas'] || '');
  const recommendations = extractListItems(normalizedSections['Actionable Recommendations'] || '');
  
  // Log extracted lists
  console.log('Extracted strengths:', strengths.length);
  console.log('Extracted challenges:', challenges.length);
  console.log('Extracted recommendations:', recommendations.length);
  
  // Extract pillar IDs from the recommendations
  const pillarIds = extractPillarIds(diagnosisText);
  
  // Create the basic response structure
  const response: DiagnosisResponse = {
    summary,
    strengths: strengths.length > 0 ? strengths : extractListItems(diagnosisText.match(/strength|talent|skill/i) ? diagnosisText : ''),
    challenges: challenges.length > 0 ? challenges : extractListItems(diagnosisText.match(/challenge|growth|improvement|weakness/i) ? diagnosisText : ''),
    recommendations: recommendations.length > 0 ? recommendations : extractListItems(diagnosisText.match(/recommend|action|step|implement/i) ? diagnosisText : ''),
    followupWorksheets: {
      pillars: pillarIds
    }
  };
  
  // Parse enhanced sections if available
  if (sections['Leadership Situation Analysis']) {
    response.situationAnalysis = parseSituationAnalysis(sections['Leadership Situation Analysis']);
  }
  
  if (sections['Strengths']) {
    response.strengthsAnalysis = parseStrengthsAnalysis(sections['Strengths']);
  }
  
  if (sections['Growth Areas']) {
    response.growthAreasAnalysis = parseGrowthAreasAnalysis(sections['Growth Areas']);
  }
  
  if (sections['Actionable Recommendations']) {
    response.actionableRecommendations = parseActionableRecommendations(sections['Actionable Recommendations']);
  }
  
  if (sections['Recommended Leadership Pillars']) {
    response.pillarRecommendations = parsePillarRecommendations(sections['Recommended Leadership Pillars']);
  }
  
  if (sections['Implementation Support']) {
    response.followupRecommendation = parseFollowupRecommendation(sections['Implementation Support']);
  }
  
  return response;
}

/**
 * Extract list items from a section
 * @param text Section text
 * @returns Array of list items
 */
export function extractListItems(text: string): string[] {
  if (!text) return [];
  
  const items: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Match numbered lists (1. Item) or bullet points (- Item, * Item)
    const match = line.match(/^(\d+\.|\-|\*|•)\s+(.+)$/);
    if (match) {
      items.push(match[2].trim());
    } else {
      // If not a bullet point, check if it's a short paragraph that might be an item
      // Only include if it's not too long (likely not a header or long paragraph)
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine.length > 5 && trimmedLine.length < 200 && 
          !trimmedLine.startsWith('#') && !items.includes(trimmedLine)) {
        // Check if it starts with a strength/challenge/recommendation keyword
        const keywords = ['strength', 'skill', 'talent', 'challenge', 'weakness', 'area', 
                         'opportunity', 'recommend', 'action', 'step', 'focus'];
        if (keywords.some(keyword => trimmedLine.toLowerCase().includes(keyword))) {
          items.push(trimmedLine);
        }
      }
    }
  }
  
  // If we still have no items but have text, take the first few sentences as items
  if (items.length === 0 && text.trim().length > 0) {
    const sentences = text.split(/\.\s+/);
    for (let i = 0; i < Math.min(5, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence && sentence.length > 10 && !items.includes(sentence)) {
        items.push(sentence);
      }
    }
  }
  
  return items;
}

/**
 * Parse the situation analysis section
 * @param text Section text
 * @returns Structured situation analysis
 */
export function parseSituationAnalysis(text: string): DiagnosisResponse['situationAnalysis'] {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // Default structure with full text
  const analysis: DiagnosisResponse['situationAnalysis'] = {
    fullText: text
  };
  
  // Try to extract specific subsections if they exist
  for (const paragraph of paragraphs) {
    const lowerPara = paragraph.toLowerCase();
    
    if (lowerPara.includes('context') || lowerPara.includes('situation')) {
      analysis.context = paragraph;
    } else if (lowerPara.includes('challenge') || lowerPara.includes('obstacle')) {
      analysis.challenges = paragraph;
    } else if (lowerPara.includes('pattern') || lowerPara.includes('behavior')) {
      analysis.patterns = paragraph;
    } else if (lowerPara.includes('impact') || lowerPara.includes('effect')) {
      analysis.impact = paragraph;
    }
  }
  
  return analysis;
}

/**
 * Parse the strengths analysis section
 * @param text Section text
 * @returns Array of structured strength analyses
 */
export function parseStrengthsAnalysis(text: string): StrengthAnalysis[] {
  const strengths: StrengthAnalysis[] = [];
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // First try to parse structured format with clear markers
  for (const paragraph of paragraphs) {
    const strengthMatch = paragraph.match(/^(?:\d+\.\s*)?(?:Strength|Strength:)\s*(.+?)(?:\n|$)/i);
    const evidenceMatch = paragraph.match(/Evidence:\s*(.+?)(?:\n|$)/i);
    const impactMatch = paragraph.match(/Impact:\s*(.+?)(?:\n|$)/i);
    const leverageMatch = paragraph.match(/(?:Leverage|How to leverage):\s*(.+?)(?:\n|$)/i);
    
    if (strengthMatch) {
      strengths.push({
        strength: strengthMatch[1].trim(),
        evidence: evidenceMatch ? evidenceMatch[1].trim() : extractContentAfterMarker(paragraph, 'Evidence'),
        impact: impactMatch ? impactMatch[1].trim() : extractContentAfterMarker(paragraph, 'Impact'),
        leverage: leverageMatch ? leverageMatch[1].trim() : extractContentAfterMarker(paragraph, 'Leverage')
      });
    }
  }
  
  // If structured parsing didn't work, fall back to list items
  if (strengths.length === 0) {
    const items = extractListItems(text);
    strengths.push(...items.map(item => ({
      strength: item,
      evidence: '',
      impact: '',
      leverage: ''
    })));
  }
  
  return strengths;
}

/**
 * Parse the growth areas analysis section
 * @param text Section text
 * @returns Array of structured growth area analyses
 */
export function parseGrowthAreasAnalysis(text: string): GrowthAreaAnalysis[] {
  const growthAreas: GrowthAreaAnalysis[] = [];
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // First try to parse structured format with clear markers
  for (const paragraph of paragraphs) {
    const areaMatch = paragraph.match(/^(?:\d+\.\s*)?(?:Area|Growth Area|Area:)\s*(.+?)(?:\n|$)/i);
    const evidenceMatch = paragraph.match(/Evidence:\s*(.+?)(?:\n|$)/i);
    const impactMatch = paragraph.match(/Impact:\s*(.+?)(?:\n|$)/i);
    const rootCauseMatch = paragraph.match(/(?:Root Cause|Cause):\s*(.+?)(?:\n|$)/i);
    
    if (areaMatch) {
      growthAreas.push({
        area: areaMatch[1].trim(),
        evidence: evidenceMatch ? evidenceMatch[1].trim() : extractContentAfterMarker(paragraph, 'Evidence'),
        impact: impactMatch ? impactMatch[1].trim() : extractContentAfterMarker(paragraph, 'Impact'),
        rootCause: rootCauseMatch ? rootCauseMatch[1].trim() : extractContentAfterMarker(paragraph, 'Root Cause')
      });
    }
  }
  
  // If structured parsing didn't work, fall back to list items
  if (growthAreas.length === 0) {
    const items = extractListItems(text);
    growthAreas.push(...items.map(item => ({
      area: item,
      evidence: '',
      impact: '',
      rootCause: ''
    })));
  }
  
  return growthAreas;
}

/**
 * Parse the actionable recommendations section
 * @param text Section text
 * @returns Array of structured actionable recommendations
 */
export function parseActionableRecommendations(text: string): ActionableRecommendation[] {
  const recommendations: ActionableRecommendation[] = [];
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // First try to parse structured format with clear markers
  for (const paragraph of paragraphs) {
    const actionMatch = paragraph.match(/^(?:\d+\.\s*)?(?:Action|Recommendation|Action:)\s*(.+?)(?:\n|$)/i);
    const implementationMatch = paragraph.match(/Implementation:\s*(.+?)(?:\n|$)/i);
    const outcomeMatch = paragraph.match(/(?:Expected )?Outcome:\s*(.+?)(?:\n|$)/i);
    const measurementMatch = paragraph.match(/(?:Measurement|Success Metric):\s*(.+?)(?:\n|$)/i);
    
    if (actionMatch) {
      recommendations.push({
        action: actionMatch[1].trim(),
        implementation: implementationMatch ? implementationMatch[1].trim() : extractContentAfterMarker(paragraph, 'Implementation'),
        outcome: outcomeMatch ? outcomeMatch[1].trim() : extractContentAfterMarker(paragraph, 'Outcome'),
        measurement: measurementMatch ? measurementMatch[1].trim() : extractContentAfterMarker(paragraph, 'Measurement')
      });
    }
  }
  
  // If structured parsing didn't work, fall back to list items
  if (recommendations.length === 0) {
    const items = extractListItems(text);
    recommendations.push(...items.map(item => ({
      action: item,
      implementation: '',
      outcome: '',
      measurement: ''
    })));
  }
  
  return recommendations;
}

/**
 * Parse the pillar recommendations section
 * @param text Section text
 * @returns Array of structured pillar recommendations
 */
export function parsePillarRecommendations(text: string): PillarRecommendation[] {
  const recommendations: PillarRecommendation[] = [];
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // Map of pillar names to IDs
  const pillarMap: Record<string, PillarType> = {
    'leadership mindset': 'pillar1_leadership_mindset',
    'goal setting': 'pillar2_goal_setting',
    'communication mastery': 'pillar3_communication_mastery',
    'time mastery': 'pillar4_time_mastery',
    'strategic thinking': 'pillar5_strategic_thinking',
    'emotional intelligence': 'pillar6_emotional_intelligence',
    'delegation and empowerment': 'pillar7_delegation_empowerment',
    'change and uncertainty': 'pillar8_change_uncertainty',
    'conflict resolution': 'pillar9_conflict_resolution',
    'high performance': 'pillar10_high_performance',
    'decision making': 'pillar11_decision_making',
    'execution and results': 'pillar12_execution_results'
  };
  
  // First try to parse structured format with clear markers
  for (const paragraph of paragraphs) {
    const titleMatch = paragraph.match(/^(?:\d+\.\s*)?(?:Pillar|Pillar:)\s*(.+?)(?:\n|$)/i);
    const reasonMatch = paragraph.match(/(?:Reason|Why):\s*(.+?)(?:\n|$)/i);
    const impactMatch = paragraph.match(/Impact:\s*(.+?)(?:\n|$)/i);
    const exerciseMatch = paragraph.match(/(?:Exercise|Key Exercise):\s*(.+?)(?:\n|$)/i);
    
    if (titleMatch) {
      const title = titleMatch[1].trim();
      let pillarId: PillarType | null = null;
      
      // Try to match the pillar title to a known pillar ID
      for (const [key, value] of Object.entries(pillarMap)) {
        if (title.toLowerCase().includes(key)) {
          pillarId = value;
          break;
        }
      }
      
      // If we found a match, add the recommendation
      if (pillarId) {
        recommendations.push({
          id: pillarId,
          title,
          reason: reasonMatch ? reasonMatch[1].trim() : extractContentAfterMarker(paragraph, 'Reason'),
          impact: impactMatch ? impactMatch[1].trim() : extractContentAfterMarker(paragraph, 'Impact'),
          exercise: exerciseMatch ? exerciseMatch[1].trim() : extractContentAfterMarker(paragraph, 'Exercise')
        });
      }
    }
  }
  
  return recommendations;
}

/**
 * Parse the follow-up recommendation section
 * @param text Section text
 * @returns Structured follow-up recommendation
 */
export function parseFollowupRecommendation(text: string): FollowupRecommendation | undefined {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // Map of follow-up names to IDs
  const followupMap: Record<string, FollowupType> = {
    'ask the right questions': 'followup-1',
    'identify the issues': 'followup-2',
    'find the best solution': 'followup-3',
    'execute and succeed': 'followup-4'
  };
  
  // Try to parse structured format with clear markers
  for (const paragraph of paragraphs) {
    const titleMatch = paragraph.match(/^(?:Worksheet|Follow-up|Worksheet:)\s*(.+?)(?:\n|$)/i);
    const reasonMatch = paragraph.match(/(?:Reason|Why):\s*(.+?)(?:\n|$)/i);
    const connectionMatch = paragraph.match(/Connection:\s*(.+?)(?:\n|$)/i);
    const focusMatch = paragraph.match(/Focus:\s*(.+?)(?:\n|$)/i);
    
    if (titleMatch) {
      const title = titleMatch[1].trim();
      let followupId: FollowupType | null = null;
      
      // Try to match the follow-up title to a known follow-up ID
      for (const [key, value] of Object.entries(followupMap)) {
        if (title.toLowerCase().includes(key)) {
          followupId = value;
          break;
        }
      }
      
      // If we found a match, return the recommendation
      if (followupId) {
        return {
          id: followupId,
          title,
          reason: reasonMatch ? reasonMatch[1].trim() : extractContentAfterMarker(paragraph, 'Reason'),
          connection: connectionMatch ? connectionMatch[1].trim() : extractContentAfterMarker(paragraph, 'Connection'),
          focus: focusMatch ? focusMatch[1].trim() : extractContentAfterMarker(paragraph, 'Focus')
        };
      }
    }
  }
  
  // If no structured format was found, try to determine from the text
  const lowerText = text.toLowerCase();
  for (const [key, value] of Object.entries(followupMap)) {
    if (lowerText.includes(key)) {
      return {
        id: value,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        reason: text,
        connection: '',
        focus: ''
      };
    }
  }
  
  return undefined;
}

/**
 * Extract content after a marker (like a colon or dash)
 * @param text Text to extract from
 * @returns Extracted content
 */
export function extractContentAfterMarker(text: string, marker: string): string {
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes(marker.toLowerCase())) {
      // Extract content after the marker on this line
      const parts = line.split(new RegExp(`${marker}\\s*:`, 'i'));
      if (parts.length > 1) {
        return parts[1].trim();
      }
      
      // If no content on this line, check the next line
      if (i + 1 < lines.length) {
        return lines[i + 1].trim();
      }
    }
  }
  
  return '';
}

/**
 * Extract pillar IDs from the diagnosis text
 * @param diagnosisText Full diagnosis text
 * @returns Array of pillar IDs
 */
export function extractPillarIds(diagnosisText: string): PillarType[] {
  const pillarIds: PillarType[] = [];
  const lowerText = diagnosisText.toLowerCase();
  
  // Map of keywords to pillar IDs
  const pillarKeywords: Record<string, PillarType> = {
    'leadership mindset': 'pillar1_leadership_mindset',
    'goal setting': 'pillar2_goal_setting',
    'communication mastery': 'pillar3_communication_mastery',
    'time mastery': 'pillar4_time_mastery',
    'strategic thinking': 'pillar5_strategic_thinking',
    'emotional intelligence': 'pillar6_emotional_intelligence',
    'delegation and empowerment': 'pillar7_delegation_empowerment',
    'change and uncertainty': 'pillar8_change_uncertainty',
    'conflict resolution': 'pillar9_conflict_resolution',
    'high performance': 'pillar10_high_performance',
    'decision making': 'pillar11_decision_making',
    'execution and results': 'pillar12_execution_results'
  };
  
  // Check for each pillar keyword in the text
  for (const [keyword, id] of Object.entries(pillarKeywords)) {
    if (lowerText.includes(keyword)) {
      pillarIds.push(id);
    }
  }
  
  return pillarIds;
}
