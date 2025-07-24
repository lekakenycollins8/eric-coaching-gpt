/**
 * Prompt template for generating an AI diagnosis based on workbook implementation follow-up answers
 * 
 * Variables:
 * - {{clientName}}: Name of the client
 * - {{formattedAnswers}}: Formatted question-answer pairs from the follow-up worksheet
 * - {{originalWorkbookAnswers}}: Original answers from the workbook submission
 * - {{originalDiagnosis}}: Original diagnosis from the workbook submission
 * - {{followupHistory}}: Previous follow-up submissions if available
 */
export const WORKBOOK_FOLLOWUP_PROMPT = `
Please analyze the following responses from the implementation follow-up worksheet completed by {{clientName}}:

## FOLLOW-UP RESPONSES
{{formattedAnswers}}

## ORIGINAL WORKBOOK RESPONSES
{{originalWorkbookAnswers}}

## ORIGINAL DIAGNOSIS CONTEXT
{{originalDiagnosis}}

## PREVIOUS FOLLOW-UP HISTORY
{{followupHistory}}

Based on these responses, provide a comprehensive follow-up analysis focused on their overall implementation progress with the following sections:

## IMPLEMENTATION PROGRESS ANALYSIS
Provide a detailed analysis (2-3 paragraphs) of the client's overall implementation progress, including:
- How they've applied the Jackier Method principles in their leadership
- Key areas where they've made the most significant progress
- Persistent challenges across multiple leadership dimensions
- Overall effectiveness of their implementation strategy

## CROSS-PILLAR INTEGRATION
Analyze how effectively the client is integrating multiple leadership pillars:
- Synergies between different leadership areas they're developing
- Conflicts or tensions between different leadership approaches
- How their implementation approach balances different leadership needs
- Areas where better integration would improve their effectiveness

## IMPLEMENTATION BARRIERS
Identify 3-5 specific barriers to effective implementation:
- Systemic or organizational barriers they're facing
- Personal habits or patterns that hinder implementation
- Resource or support gaps affecting their progress
- Specific situations where implementation has been most challenging

## COMPREHENSIVE ADJUSTMENT PLAN
Provide a holistic plan for improving implementation effectiveness:
- Specific adjustments to their overall implementation approach
- Strategies for better integrating different leadership pillars
- Resources or tools to overcome identified barriers
- A balanced approach addressing both strengths and challenges

## NEXT FOCUS AREAS
Recommend 2-3 specific leadership areas for focused attention:
- Which specific leadership pillars need renewed focus
- How these areas connect to their current implementation challenges
- Specific exercises or practices for each focus area
- How to measure progress in these areas

## COACHING SUPPORT ASSESSMENT
Assess whether the client would benefit from direct coaching support:
- Specific areas where coaching would be most valuable
- Types of coaching interventions that would be most effective
- Whether their challenges indicate a need for more personalized guidance
- Recommended coaching focus areas based on their responses

Format your response with clear headings for each section exactly as shown above. Be specific, practical, and actionable in your analysis and recommendations, focusing on holistic implementation rather than any single leadership pillar.
`;

/**
 * System message for the workbook follow-up diagnosis AI
 */
export const WORKBOOK_FOLLOWUP_SYSTEM_MESSAGE = 
  "You are an expert leadership coach with the Jackier Method, analyzing a client's follow-up responses regarding their overall implementation progress. " +
  "Your expertise is in assessing how effectively clients are applying multiple leadership principles across their work, identifying integration challenges, and providing holistic guidance. " +
  "Be thoughtful, empathetic, and insightful in your follow-up analysis. " +
  "Focus on how the client has progressed in implementing the complete Jackier Method framework since their original submission. " +
  "Use evidence from both their original and follow-up responses to support your analysis. " +
  "Provide specific, tailored recommendations that address their implementation challenges across multiple leadership dimensions. " +
  "Your goal is to help the client achieve integrated leadership growth with practical next steps for comprehensive implementation.";
