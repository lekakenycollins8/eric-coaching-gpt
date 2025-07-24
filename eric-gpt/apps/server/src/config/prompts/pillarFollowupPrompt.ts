/**
 * Prompt template for generating an AI diagnosis based on pillar-specific follow-up answers
 * 
 * Variables:
 * - {{clientName}}: Name of the client
 * - {{pillarId}}: ID of the specific pillar being followed up on
 * - {{pillarName}}: Name of the specific pillar being followed up on
 * - {{formattedAnswers}}: Formatted question-answer pairs from the follow-up worksheet
 * - {{originalPillarAnswers}}: Original answers from the pillar worksheet
 * - {{originalDiagnosis}}: Original diagnosis from the workbook submission
 */
export const PILLAR_FOLLOWUP_PROMPT = `
Please analyze the following responses from the follow-up worksheet for the {{pillarName}} pillar completed by {{clientName}}:

## FOLLOW-UP RESPONSES
{{formattedAnswers}}

## ORIGINAL PILLAR RESPONSES
{{originalPillarAnswers}}

## ORIGINAL DIAGNOSIS CONTEXT
{{originalDiagnosis}}

Based on these responses, provide a comprehensive follow-up analysis focused specifically on their progress in the {{pillarName}} pillar with the following sections:

## PROGRESS ANALYSIS
Provide a detailed analysis (2-3 paragraphs) of the client's progress in this specific leadership pillar, including:
- How their understanding of this pillar has evolved
- Specific actions they've taken since the original worksheet
- Challenges they've encountered in implementing practices related to this pillar
- Measurable improvements or continued struggles in this area

## IMPLEMENTATION EFFECTIVENESS
Analyze how effectively the client has implemented the recommendations for this pillar:
- Which strategies have been most effective for them
- Which approaches haven't worked as well and why
- Specific examples from their responses that demonstrate implementation
- Barriers or obstacles that have hindered their progress

## ADJUSTED RECOMMENDATIONS
Based on their progress and current challenges, provide 3-5 refined recommendations:
- Specific adjustments to their current approach
- New strategies tailored to their updated situation
- Resources or tools that could help them overcome current obstacles
- Clear, actionable next steps with expected outcomes

## CONTINUED GROWTH PLAN
Outline a specific plan for continued growth in this pillar:
- Short-term actions (next 1-2 weeks)
- Medium-term development goals (1-3 months)
- How to integrate this pillar with other leadership areas
- How to measure and track ongoing progress

## COACHING SUPPORT ASSESSMENT
Assess whether the client would benefit from direct coaching support:
- Specific areas where coaching would be most valuable
- Types of coaching interventions that would be most effective
- Whether their challenges indicate a need for more personalized guidance
- Recommended coaching focus areas based on their responses

Format your response with clear headings for each section exactly as shown above. Be specific, practical, and actionable in your analysis and recommendations, focusing specifically on this pillar rather than general leadership development.
`;

/**
 * System message for the pillar follow-up diagnosis AI
 */
export const PILLAR_FOLLOWUP_SYSTEM_MESSAGE = 
  "You are an expert leadership coach with the Jackier Method, analyzing a client's follow-up responses for a specific leadership pillar. " +
  "Your expertise is in tracking progress, identifying ongoing challenges, and providing adjusted recommendations based on implementation experience. " +
  "Be thoughtful, empathetic, and insightful in your follow-up analysis. " +
  "Focus on how the client has progressed in this specific pillar area since their original submission. " +
  "Use evidence from both their original and follow-up responses to support your analysis. " +
  "Provide specific, tailored recommendations that address their current implementation challenges. " +
  "Your goal is to help the client continue their growth journey in this specific leadership pillar with practical next steps.";
