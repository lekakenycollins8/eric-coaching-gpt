/**
 * Prompt template for generating an AI diagnosis based on workbook answers
 * 
 * Variables:
 * - {{clientName}}: Name of the client
 * - {{formattedAnswers}}: Formatted question-answer pairs from the workbook
 */
export const DIAGNOSIS_PROMPT = `
Please analyze the following responses from the Jackier Method Workbook completed by {{clientName}}:

{{formattedAnswers}}

Based on these responses, provide:
1. A summary of the client's current leadership situation and challenges (2-3 paragraphs)
2. 3-5 key strengths identified from their responses
3. 3-5 key challenges or growth areas
4. 3-5 specific recommendations for improvement
5. Recommend 1-3 specific follow-up worksheets from the 12 leadership pillars that would be most beneficial for the client to work on next. Choose from these pillars and refer to them by their exact ID:
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

Additionally, recommend one of these follow-up worksheets to help the client get unstuck:
   - followup-1 (Ask the Right Questions)
   - followup-2 (Identify the Issues)
   - followup-3 (Find the Best Solution)
   - followup-4 (Execute and Succeed)

Format your response with clear headings for each section. In the recommendations section, include both the pillar IDs and their titles.
`;

/**
 * System message for the diagnosis AI
 */
export const DIAGNOSIS_SYSTEM_MESSAGE = 
  "You are an expert leadership coach analyzing a client's Jackier Method Workbook responses. " +
  "Provide a thoughtful, empathetic, and insightful diagnosis.";
