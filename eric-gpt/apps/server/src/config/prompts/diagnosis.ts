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
5. Suggest which follow-up worksheet would be most beneficial (choose from: communication, delegation, strategic-thinking, emotional-intelligence, conflict-resolution)

Format your response with clear headings for each section.
`;

/**
 * System message for the diagnosis AI
 */
export const DIAGNOSIS_SYSTEM_MESSAGE = 
  "You are an expert leadership coach analyzing a client's Jackier Method Workbook responses. " +
  "Provide a thoughtful, empathetic, and insightful diagnosis.";
