# New Follow-up System Implementation Plan

## Current Understanding & Corrections

### What We've Misunderstood

Our current implementation has several critical misunderstandings that need to be corrected:

1. **Follow-up Types Distinction**: We've been treating all follow-ups as a single type, when in fact there are two distinct types:
   - **Pillar Follow-ups**: Specific to each of the 12 pillars of Crystal Clear Leadership
   - **Workbook Follow-ups**: Related to the overall implementation workbook

2. **Context Loading**: We're not properly loading the right context based on follow-up type:
   - For pillar follow-ups, we need the original pillar-specific submission
   - For workbook follow-ups, we need the original workbook submission

3. **AI Prompts**: We're using a generic prompt for all follow-ups instead of specialized prompts:
   - Pillar follow-ups need prompts focused on progress in specific leadership areas
   - Workbook follow-ups need prompts focused on overall implementation progress

4. **Email Notifications**: Our email notifications don't distinguish between follow-up types:
   - Different formatting and content is needed based on follow-up type
   - Different analysis fields should be highlighted based on type

### What We've Done Correctly

Despite these misunderstandings, we've made good progress in several areas:

1. **Basic Infrastructure**: We've set up the core routes, models, and services needed
2. **Trigger Logic**: We've implemented solid logic for determining when follow-ups should be triggered
3. **Recommendations API**: We've created an API that returns prioritized follow-up recommendations
4. **Email Service**: We've established the basic email notification system

## Correction Plan

### 1. Follow-up Type Detection & Context Loading

#### Current Implementation
```typescript
// In submit/route.ts
if (followupId.includes('pillar')) {
  // For pillar follow-ups, add to the pillars array
  if (!originalSubmission.pillars) {
    originalSubmission.pillars = [];
  }
  originalSubmission.pillars.push(worksheetSubmission);
} else {
  // For implementation follow-ups, set as the followup field
  originalSubmission.followup = worksheetSubmission;
}
```

#### Required Changes
- Create a robust `getFollowupType` function in `followupUtils.ts`
- Implement a `loadFollowupContext` function that retrieves the appropriate original submission data
- Update all routes to use these utility functions for consistent type detection

### 2. Specialized AI Prompts

#### Current Implementation
```typescript
// In submit/route.ts
const rawDiagnosisResponse = await generateAIDiagnosis(
  JSON.stringify(combinedAnswers), 
  followupId,
  originalSubmission.diagnosis as any
);
```

#### Required Changes
- Create separate prompt templates for pillar and workbook follow-ups
- Implement a prompt selection system based on follow-up type
- Ensure prompts include the right context and instructions for each type

### 3. Enhanced Email Notifications

#### Current Implementation
```typescript
// In emailService.ts
enhancedDiagnosis = `
  <h3>Enhanced AI Diagnosis</h3>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
    <h4>Summary</h4>
    <p>${originalSubmission.diagnosis.summary || 'No summary available'}</p>
    
    <h4>Progress Analysis</h4>
    <p>${originalSubmission.diagnosis.situationAnalysis || 'No progress analysis available'}</p>
    
    // ... more fields ...
  </div>
`;
```

#### Required Changes
- Update email templates to include type-specific sections
- Format diagnosis content differently based on follow-up type
- Include relevant context and comparisons for each type

## Implementation Tasks

### 1. Backend Utilities

- [ ] **Update `followupUtils.ts`**:
  - [ ] Add `getFollowupType(followupId: string): 'pillar' | 'workbook'` function
  - [ ] Create `loadFollowupContext(originalSubmission, followupType, pillarId?)` function
  - [ ] Add helper functions for loading worksheet metadata with previous user answers and ai feedback

- [ ] **Create Prompt Templates**:
  - [ ] Create `prompts/pillarFollowupPrompt.ts` for pillar-specific follow-ups
  - [ ] Create `prompts/workbookFollowupPrompt.ts` for workbook implementation follow-ups
  - [ ] Ensure prompts include instructions for type-specific analysis

### 2. API Routes

- [ ] **Update `/api/followup/submit/route.ts`**:
  - [ ] Use `getFollowupType` to determine follow-up type
  - [ ] Load appropriate context using `loadFollowupContext`
  - [ ] Select and use the right prompt template based on type
  - [ ] Store diagnosis in the appropriate location based on type
  - [ ] Pass type and diagnosis to email service

- [ ] **Update `/api/followup/recommendations/route.ts`**:
  - [ ] Filter recommendations by follow-up type
  - [ ] Include type-specific metadata in recommendations
  - [ ] Prioritize recommendations based on type-specific criteria

### 3. Email Service

- [ ] **Update `emailService.ts`**:
  - [ ] Add follow-up type parameter to `sendFollowupSubmissionNotification`
  - [ ] Create type-specific email templates
  - [ ] Format diagnosis content differently based on type
  - [ ] Include relevant context and comparisons for each type

### 4. Frontend Components

- [ ] **Create Follow-up Form Components**:
  - [ ] Detect follow-up type from URL or context
  - [ ] Load appropriate original submission data
  - [ ] Display different UI elements based on type
  - [ ] Show relevant context from original submission

- [ ] **Implement Progress Indicators**:
  - [ ] For pillar follow-ups: Show progress in specific pillar metrics
  - [ ] For workbook follow-ups: Show overall implementation progress

- [ ] **Update Recommendations Display**:
  - [ ] Filter and prioritize recommendations based on type
  - [ ] Show pillar-specific recommendations for pillar follow-ups
  - [ ] Show comprehensive recommendations for workbook follow-ups

## Testing Plan

1. **Unit Tests**:
   - [ ] Test follow-up type detection with various IDs
   - [ ] Test context loading for both follow-up types
   - [ ] Test prompt generation for both types

2. **Integration Tests**:
   - [ ] Test submission flow for pillar follow-ups
   - [ ] Test submission flow for workbook follow-ups
   - [ ] Test email notifications for both types

3. **End-to-End Tests**:
   - [ ] Test complete user journey for pillar follow-ups
   - [ ] Test complete user journey for workbook follow-ups

## Timeline

1. **Week 1**: Backend Utilities & API Routes
   - Update `followupUtils.ts`
   - Create prompt templates
   - Update submission and recommendations routes

2. **Week 2**: Email Service & Frontend Components
   - Update email service
   - Create follow-up form components
   - Implement progress indicators

3. **Week 3**: Testing & Refinement
   - Conduct unit and integration tests
   - Refine implementation based on test results
   - Document final implementation

## Conclusion

This updated plan addresses the critical misunderstandings in our current implementation and provides a clear path forward for creating a comprehensive follow-up system that properly handles both pillar and workbook follow-ups. By implementing these changes, we'll ensure that users receive appropriate context, prompts, and UI elements for each follow-up type, providing a cohesive and effective follow-up experience.
