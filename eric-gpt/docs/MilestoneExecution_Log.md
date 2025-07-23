# Milestone Execution Log

## Milestone 6: Enhanced AI Diagnosis Engine

### Goal
Improve the AI diagnosis engine to provide more personalized and actionable insights

### Analysis of Current Implementation

#### Current Architecture
The AI diagnosis engine consists of several key components:

1. **Prompt Configuration**
   - Located in `/apps/server/src/config/prompts/diagnosis.ts`
   - Contains the main prompt template and system message for the OpenAI API
   - Current prompt requests basic information: summary, strengths, challenges, recommendations, and pillar suggestions

2. **Diagnosis Utilities**
   - Located in `/apps/server/src/utils/diagnosisUtils.ts`
   - Contains functions for generating and parsing AI diagnoses
   - Key functions:
     - `generateAIDiagnosis`: Sends formatted answers to OpenAI API
     - `parseDiagnosisResponse`: Extracts structured data from AI response
     - `extractPillarIds`: Identifies recommended pillars from text
     - `determineFollowupWorksheets`: Selects appropriate follow-up worksheets

3. **Follow-up Utilities**
   - Located in `/apps/server/src/utils/followupUtils.ts`
   - Defines types and interfaces for worksheets and questions
   - Handles loading and validation of follow-up worksheets

4. **Workbook Loader**
   - Located in `/apps/server/src/utils/workbookLoader.ts`
   - Loads worksheet data from JSON files
   - Provides functions to access specific worksheets by ID

### Identified Improvement Areas

1. **Prompt Enhancement**
   - Current prompt is basic and could extract more detailed insights
   - No context preservation between initial diagnosis and follow-ups
   - Limited personalization in recommendations

2. **Response Parsing**
   - Current parsing is simplistic and may miss nuanced information
   - No structured format for explaining pillar recommendations
   - Limited error handling for unexpected AI responses

3. **Pillar Selection Logic**
   - Basic keyword matching for pillar selection
   - No weighting system for more relevant pillars
   - No consideration of user's previous submissions

4. **User Experience**
   - Limited explanation of why pillars were recommended
   - No detailed action items tied to recommendations
   - No progress tracking between initial and follow-up worksheets

### Implementation Plan

#### 1. Enhance GPT-4 Prompts
- Refine the diagnosis prompt to extract deeper insights
- Add structured format requirements for more reliable parsing
- Include specific instructions for actionable recommendations
- Add context preservation for follow-up analyses

#### 2. Improve Response Parsing
- Enhance the parsing logic to handle more structured responses
- Add better error handling for unexpected formats
- Implement more robust extraction of recommendations and explanations

#### 3. Enhance Pillar Selection Logic
- Implement a more sophisticated scoring system for pillar relevance
- Consider user's previous submissions when making recommendations
- Add explanation generation for why each pillar was selected

#### 4. Improve Presentation of Results
- Add detailed explanations for pillar recommendations
- Include specific action items for each recommendation
- Enhance the structure of the diagnosis response for better UI presentation

### Next Steps
1. Implement prompt enhancements
2. Update parsing logic
3. Improve pillar selection algorithm
4. Test with sample data
5. Document changes

### Risks and Mitigation
- **Risk**: More complex prompts may increase token usage and costs
  - **Mitigation**: Optimize prompts for efficiency and monitor usage

- **Risk**: Changes to parsing logic may break existing functionality
  - **Mitigation**: Implement comprehensive testing and fallback mechanisms

- **Risk**: Enhanced AI responses may not match UI expectations
  - **Mitigation**: Update UI components to handle new response formats
