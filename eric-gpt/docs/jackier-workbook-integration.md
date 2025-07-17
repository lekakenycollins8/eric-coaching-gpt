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

4. **Follow-up System**
   - Interactive follow-up worksheets based on progress
   - Feedback loop to determine if current worksheets are effective
   - Additional clarifying questions when needed
   - Adaptive recommendation engine based on ongoing user responses

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
9. Cycle continues with adaptive recommendations

## Technical Requirements

1. **Data Model Extensions**
   - New `Workbook` model distinct from regular worksheets
   - `WorkbookSubmission` model with comprehensive response data
   - `DiagnosisResult` model linking workbook to recommendations
   - `FollowupAssessment` model for tracking progress

2. **API Endpoints**
   - `/api/workbook` - Get workbook questions
   - `/api/workbook/submit` - Submit workbook responses
   - `/api/diagnosis` - Get personalized diagnosis results
   - `/api/followup` - Get/submit follow-up assessments
   - `/api/schedule` - Initiate scheduling with Eric

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

### Phase 5: Follow-up System & Final Integration
- Implement follow-up assessment system
- Create notification mechanism for follow-up worksheets
- Build follow-up assessment UI
- Integrate with existing worksheet system
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
