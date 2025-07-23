/**
 * Prompt template for generating an AI diagnosis based on workbook answers
 * 
 * Variables:
 * - {{clientName}}: Name of the client
 * - {{formattedAnswers}}: Formatted question-answer pairs from the workbook
 * - {{previousContext}}: Optional previous context from earlier submissions
 */
export const DIAGNOSIS_PROMPT = `
Please analyze the following responses from the Jackier Method Workbook completed by {{clientName}}:

{{formattedAnswers}}

{{previousContext}}

Based on these responses, provide a comprehensive leadership diagnosis with the following sections:

## LEADERSHIP SITUATION ANALYSIS
Provide a detailed analysis (2-3 paragraphs) of the client's current leadership situation, including:
- Their primary leadership context and role
- Key challenges they're facing
- Underlying patterns or themes in their leadership approach
- How their current situation impacts their effectiveness

## KEY STRENGTHS
Identify 3-5 specific leadership strengths, including:
- The strength itself (be specific)
- Evidence from their responses that demonstrates this strength
- How this strength positively impacts their leadership
- How they can leverage this strength further

## GROWTH AREAS
Identify 3-5 specific growth areas or challenges, including:
- The specific challenge or growth area
- Evidence from their responses that indicates this area
- How this area impacts their leadership effectiveness
- The root cause or underlying factors contributing to this challenge

## ACTIONABLE RECOMMENDATIONS
Provide 3-5 specific, actionable recommendations, including:
- The specific action to take
- How to implement this action (specific steps)
- Expected outcomes from taking this action
- How to measure success

## RECOMMENDED LEADERSHIP PILLARS
Recommend 2-3 specific leadership pillars for the client to focus on next. For each pillar:
- Specify the exact pillar ID
- Explain why this pillar is particularly relevant to their situation
- Describe how working on this pillar will address their specific challenges
- Provide one specific exercise or practice related to this pillar

Choose from these pillars and refer to them by their exact ID:
- pillar1_leadership_mindset (Leadership Mindset)
- pillar2_goal_setting (Goal Setting)
- pillar3_communication_mastery (Communication Mastery)
- pillar4_time_mastery (Time Mastery)
- pillar5_strategic_thinking (Strategic Thinking)
- pillar6_emotional_intelligence (Emotional Intelligence)
- pillar7_delegation_empowerment (Delegation & Empowerment)
- pillar8_change_uncertainty (Change & Uncertainty)
- pillar9_conflict_resolution (Conflict Resolution)
- pillar10_high_performance (High Performance)
- pillar11_decision_making (Decision Making)
- pillar12_execution_results (Execution & Results)

## IMPLEMENTATION SUPPORT
Recommend one specific follow-up worksheet to help the client implement your recommendations. Include:
- The exact worksheet ID
- Why this particular worksheet will help them
- How it connects to their specific challenges
- What they should focus on when completing it

Choose from these follow-up worksheets:
- followup-1 (Ask the Right Questions)
- followup-2 (Identify the Issues)
- followup-3 (Find the Best Solution)
- followup-4 (Execute and Succeed)

Format your response with clear headings for each section exactly as shown above. Be specific, practical, and actionable in your analysis and recommendations.
`;

/**
 * System message for the diagnosis AI
 */
export const DIAGNOSIS_SYSTEM_MESSAGE = 
  "You are an expert leadership coach with the Jackier Method, analyzing a client's workbook responses. " +
  "Your expertise is in identifying patterns in leadership behavior and providing actionable, personalized guidance. " +
  "Be thoughtful, empathetic, and insightful in your diagnosis. " +
  "Focus on practical, implementable advice that addresses the client's specific situation. " +
  "Use evidence from their responses to support your analysis. " +
  "When recommending leadership pillars, be specific about why they are relevant to this particular client. " +
  "Your goal is to provide a diagnosis that helps the client understand their leadership profile and gives them clear next steps for growth.";
