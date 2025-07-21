# Jackier Method Workbook Integration

## Overview

This document outlines the integration of the Jackier Method Workbook with the Eric GPT Coaching Platform, creating a hybrid AI/human coaching experience that combines AI diagnosis with personalized human coaching.

## Key Features

1. **Mandatory Workbook Assessment**
   - All users must complete the Jackier Method Workbook
   - Comprehensive assessment of leadership challenges and strengths
   - Data collected to identify key pillars needing focus

2. **AI Diagnosis & Recommendations**
   - GPT analysis of workbook responses
   - Identification of primary leadership pillars requiring attention
   - Personalized worksheet recommendations based on diagnosis
   - Dual delivery of feedback (to user and coaching team)

3. **Human Coaching Integration**
   - Prompt to schedule call with Eric after AI assessment
   - Email notification to help@jackiercoaching.com with user responses and AI analysis
   - Seamless handoff between AI and human coaching

4. **Enhanced Follow-up System**
   - Contextual follow-up worksheets based on specific user challenges
   - Intelligent timing for follow-up recommendations (1-2 weeks after completion)
   - Progress tracking visualization of the user's leadership journey
   - Reflection features that reference previous worksheet answers
   - Coaching integration at strategic points in the user journey
   - Adaptive content that tailors questions based on previous responses
   - Feedback loop to determine if current worksheets are effective

## User Flow

1. User signs up/logs in to the platform
2. User is directed to complete the Jackier Method Workbook (mandatory)
3. User submits workbook responses
4. AI processes responses to generate:
   - Leadership pillar diagnosis
   - Personalized worksheet recommendations
   - Initial coaching feedback
5. Results delivered to:
   - User's dashboard
   - help@jackiercoaching.com (with full workbook responses)
6. User prompted to schedule call with Eric
7. User works through recommended worksheets
8. Follow-up assessment determines:
   - If current worksheets are effective
   - If additional clarification is needed
   - What next steps would be most beneficial
9. User sees their progress on their leadership journey visualization
10. At strategic points, user is offered coaching integration with Eric
11. Follow-up worksheets adapt based on user's previous responses
12. Cycle continues with increasingly personalized recommendations

## Technical Requirements

1. **Data Model Extensions**
   - New `Workbook` model distinct from regular worksheets
   - `WorkbookSubmission` model with comprehensive response data
   - `DiagnosisResult` model linking workbook to recommendations
   - `FollowupAssessment` model for tracking progress
   - `WorksheetRelationship` model to track connections between pillar and follow-up worksheets
   - `UserProgress` model for visualizing the leadership development journey
   - `CoachingTouchpoint` model to track coaching integration opportunities

2. **API Endpoints**
   - `/api/workbook` - Get workbook questions
   - `/api/workbook/submit` - Submit workbook responses
   - `/api/diagnosis` - Get personalized diagnosis results
   - `/api/followup` - Get/submit follow-up assessments
   - `/api/schedule` - Initiate scheduling with Eric
   - `/api/progress` - Get user's leadership journey progress
   - `/api/related-submissions` - Get related worksheet submissions
   - `/api/coaching-touchpoints` - Get/submit coaching integration requests

3. **Email Integration**
   - Automated email to help@jackiercoaching.com
   - Rich HTML format with workbook responses and AI analysis
   - Calendar scheduling links

4. **AI Enhancements**
   - Specialized prompt for workbook analysis
   - Pillar recommendation algorithm
   - Follow-up question generation based on responses
   - Progress assessment capabilities

## Implementation Considerations

- Ensure workbook completion is enforced before accessing other features
- Design intuitive UI for lengthy workbook to prevent user fatigue
- Allow users to save partial progress and return later
- Implement proper validation for required fields
- Ensure mobile-friendly design for all workbook components

## Phased Implementation Approach

### Phase 1: Data Models & Core Backend
- Create MongoDB models for Workbook, WorkbookSubmission, and FollowupAssessment
- Convert Jackier Method Workbook content to structured JSON format
- Implement basic API endpoints for workbook retrieval
- Add subscription checks for workbook access
- Update middleware to include new API routes in knownApiRoutes array

### Phase 2: Workbook UI & Progress Saving
- Design multi-section workbook UI with progress tracking
- Implement auto-save functionality for partial progress
- Create form validation for required fields
- Add "Save & Continue Later" and "Submit" functionality
- Implement workbook status indicators on dashboard

### Phase 3: AI Diagnosis Engine
- Develop GPT-4 prompt for leadership pillar diagnosis
- Create analysis logic to identify primary leadership pillars
- Implement worksheet recommendation algorithm
- Build diagnosis results visualization dashboard
- Add PDF generation for diagnosis results using existing infrastructure

### Phase 4: Email & Human Coaching Integration
- Build email notification system using Nodemailer
- Create HTML email template for workbook submissions
- Implement prompt for scheduling calls with Eric
- Add contact page link integration
- Test email delivery to help@jackiercoaching.com

### Phase 5: Enhanced Follow-up System & Final Integration
- Implement contextual follow-up assessment system
- Create intelligent notification mechanism with optimal timing for follow-up worksheets
- Build adaptive follow-up assessment UI that references previous worksheet answers
- Implement progress tracking visualization for user's leadership journey
- Develop reflection features that connect pillar and follow-up worksheets
- Add coaching integration touchpoints at strategic moments in the user journey
- Create adaptive content system that tailors questions based on previous responses
- Perform comprehensive testing and bug fixes

## Technical Integration Notes

### Environment Variables
- Use `NEXT_PUBLIC_APP_URL` for web application URL references
- Use `NEXT_PUBLIC_API_URL` for API server URL references
- Add new email-related environment variables for Nodemailer integration

### API Structure
- Follow the existing pattern of separating server and web app routes
- Implement proxy routes in the web app that forward to server endpoints
- Ensure proper error handling for non-JSON responses
- Add content-type checking before JSON parsing

### Data Storage
- Store workbook definition as JSON files similar to existing worksheets
- Use MongoDB for storing user submissions and diagnosis results
- Maintain consistency in data access patterns across the application

### Authentication & Authorization
- Leverage existing NextAuth.js implementation for authentication
- Implement subscription checks in middleware for workbook access
- Ensure proper user authorization for accessing personal diagnosis results
- Create clear visualization of diagnosed pillars and recommendations
- Implement secure data handling for sensitive coaching information
- Develop seamless transition between AI and human coaching interactions
- Build adaptive system that improves recommendations over time

## Enhanced Follow-up System Implementation

### Contextual Recommendations
- Analyze user submissions to identify specific challenges
- Map challenges to appropriate follow-up worksheets
- Generate personalized explanations for each recommendation
- Store recommendation context for future reference

### Progress Tracking Visualization
- Design leadership journey map UI component
- Create data structure for tracking completed worksheets
- Implement visual connections between related worksheets
- Add progress indicators and achievement markers

### Intelligent Follow-up Timing
- Implement notification scheduling system
- Create algorithm to determine optimal follow-up timing
- Design reminder emails with context from previous work
- Add user preferences for notification frequency

### Reflection and Integration Features
- Build UI components to display previous worksheet insights
- Create reflection prompts based on previous answers
- Implement progress self-assessment features
- Store and retrieve key insights for contextual display

### Enhanced Coaching Integration
- Add coaching request fields to follow-up worksheets
- Create system to package worksheet responses for coaching context
- Implement "Request Coaching Session" workflow
- Design coach dashboard for viewing user progress

### Adaptive Content System
- Build logic to filter and prioritize questions based on previous answers
- Create dynamic worksheet generation system
- Implement difficulty adjustment based on user mastery
- Design adaptive prompts that reference specific user challenges
