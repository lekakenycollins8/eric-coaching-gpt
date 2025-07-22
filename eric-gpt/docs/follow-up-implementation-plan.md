# Follow-up Worksheet Enhancement Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for enhancing the follow-up worksheet system in the Eric GPT Coaching Platform. The plan is organized into manageable milestones that will be checked regularly to ensure we stay on track. Each milestone includes specific tasks, expected outcomes, and dependencies.

## Current Status

We have completed up to Phase 3 of the Jackier Method Workbook Integration and made significant progress on Phase 4:
- Data models and core backend are in place
- Workbook UI and progress saving functionality are implemented
- AI diagnosis engine is operational
- Basic routing for worksheets has been fixed (pillar vs. follow-up paths)
- Follow-up worksheet submission page has been implemented
- Coaching integration components have been created

## Implementation Milestones

### Milestone 1: Research & Analysis (COMPLETED)
**Goal:** Gain comprehensive understanding of the existing codebase to ensure proper integration

#### Tasks:
- [x] Analyze server-side data models and API endpoints
- [x] Review client-side hooks and components for worksheet handling
- [x] Examine existing AI integration for diagnosis generation
- [x] Document data flow between pillar worksheets and follow-up worksheets
- [x] Identify potential integration points for new features

#### Outcome:
- Detailed documentation of current system architecture
- Identified architectural pattern of separating web and server components
- Discovered the proxy pattern used for API requests from web to server
- Noted React Query usage for data fetching
- Identified Swagger documentation requirements for server API routes
- Identification of code patterns to follow
- List of potential risks and mitigation strategies
- Clear understanding of existing AI integration points

---

### Milestone 2: Architectural Corrections (COMPLETED)
**Goal:** Fix architectural inconsistencies in the current implementation

#### Tasks:
- [x] Move API routes from web to server app
  - [x] Move `/api/coaching/schedule` to server app with Swagger documentation
  - [x] Move `/api/coaching/dismiss-prompt` to server app with Swagger documentation
- [x] Create proxy routes in web app
  - [x] Create proxy for coaching schedule API
  - [x] Create proxy for coaching prompt dismissal API
- [x] Update React hooks to use React Query
  - [x] Refactor `useCoachingSchedule` to use React Query
  - [x] Refactor `useCoachingPrompt` to use React Query
- [x] Ensure proper error handling for API responses
  - [x] Add content-type checking before JSON parsing
  - [x] Implement consistent error response format

#### Outcome:
- Properly structured API architecture following project standards
- Improved data fetching with React Query for caching and state management
- Consistent error handling across all API interactions with non-JSON response handling
- Documented API endpoints with Swagger annotations
- Separation of concerns with business logic in server and proxy pattern in web
- Better TypeScript typing with proper error handling

---

### Milestone 3: Email & Human Coaching Integration (Phase 4) (PARTIALLY COMPLETED)
**Goal:** Complete the email notification system and coaching integration touchpoints

#### Tasks:
- [x] Create coaching UI components (CoachingPrompt, CoachingConfirmation)
- [x] Implement coaching dashboard pages (/dashboard/coaching, /coaching/schedule, /coaching/overview)
- [x] Create API routes for scheduling sessions and dismissing prompts
- [x] Implement React hooks for coaching interactions (useCoachingSchedule, useCoachingPrompt)
- [x] Integrate EmailService with coaching API routes
  - [x] Connect emailService.sendCoachingPrompt() with coaching schedule API
  - [x] Add email notifications when sessions are scheduled
  - [x] Add email notifications when prompts are dismissed
- [ ] Complete database integration for coaching sessions
  - [ ] Implement database operations for storing coaching sessions
  - [ ] Create proper models for tracking prompt dismissals
- [x] Test email delivery to coaching team
  - [x] Verify email templates render correctly
  - [x] Ensure emails are delivered to appropriate recipients
- [x] Validate full user flow from worksheet submission to coaching

#### Implementation Details:

##### 1. Server-Side API Routes

**Schedule Route (`/apps/server/src/app/api/coaching/schedule/route.ts`):**
- Implemented POST handler for scheduling coaching sessions
- Added user authentication and subscription access checks
- Integrated with EmailService to send confirmation emails to users
- Added second email notification to coaching team with session details
- Included detailed scheduling information in emails (date, time, notes)
- Added proper error handling for database and email operations

**Dismiss Prompt Route (`/apps/server/src/app/api/coaching/dismiss-prompt/route.ts`):**
- Implemented POST handler for tracking when users dismiss coaching prompts
- Added optional email notifications for dismissed prompts
- Prepared structure for future database integration

##### 2. Email Service Integration

**EmailService (`/apps/server/src/services/emailService.ts`):**
- Enhanced the sendCoachingPrompt method to handle both scheduling confirmations and dismissals
- Created professional email templates with proper formatting and styling
- Added dual-recipient functionality to notify both users and coaching team
- Implemented proper error handling and logging for email delivery issues
- Fixed SMTP configuration to match working auth email implementation

##### 3. Database Integration (Deferred)

**Note:** Due to timeline constraints and prioritization of other features, the database integration for coaching sessions has been deferred to a future milestone. The current implementation successfully handles email notifications to both users and the coaching team, which satisfies the immediate requirements.

**Future Tasks (Deferred):**
- Create MongoDB models for coaching sessions and prompt dismissals
- Implement database operations in API routes to store session details
- Add tracking for prompt dismissals to analyze user engagement
- Create admin dashboard for coaching team to view scheduled sessions

##### 2. Web App Proxy Routes

**Dismiss-Prompt Proxy (`/apps/web/src/app/api/coaching/dismiss-prompt/route.ts`):**
- Updated to include the user's email in the request body when forwarding to the server
- This allows the server to retrieve the user object for email sending

##### 3. React Query Hooks

**useCoachingSchedule (`/apps/web/src/hooks/useCoachingSchedule.ts`):**
- Updated the `ScheduleCoachingResponse` interface to include the `emailSent` field
- Added state tracking for email status with `useState`
- Enhanced toast notifications to provide feedback about email delivery status
- Exposed the `emailSent` state in the hook's return value for UI components

**useCoachingPrompt (`/apps/web/src/hooks/useCoachingPrompt.ts`):**
- Updated the `DismissPromptResponse` interface to include the `emailSent` field
- Added state tracking for email status with `useState`
- Added handling of email status in the `onSuccess` callback
- Exposed the `emailSent` state in the hook's return value for UI components

##### 4. Integration Flow

**Current Implementation:**
- When a user schedules a coaching session, confirmation emails are sent to both the user and coaching team
- Emails include all relevant session details (date, time, notes, submission context)
- The system handles errors gracefully, allowing the scheduling process to continue even if email sending fails
- Both API routes properly connect to the database before attempting to retrieve user information

**Coaching Session Scheduling:**
- User submits a form to schedule a coaching session
- Web app sends request to `/api/coaching/schedule` proxy route
- Proxy adds user information and forwards to server
- Server validates the request and checks subscription access
- Server sends confirmation email via `emailService.sendCoachingPrompt()`
- Server returns success response with `emailSent` status
- UI displays confirmation with email status feedback

**Coaching Prompt Dismissal:**
- User dismisses a coaching prompt
- Web app sends request to `/api/coaching/dismiss-prompt` proxy route
- Proxy adds user information (including email) and forwards to server
- Server retrieves the user object using the email
- Server sends notification email via `emailService.sendCoachingPrompt()`
- Server returns success response with `emailSent` status
- UI can optionally display feedback about the email status

##### 5. Architecture Integrity

The implementation maintains the project's architectural principles:

- **Separation of Concerns:**
  - Server handles all business logic, email sending, and database operations
  - Web app only manages UI state and proxies requests
  - React Query hooks encapsulate all API interactions

- **Error Handling:**
  - Robust error handling at all levels
  - Non-blocking email sending (failures don't break the main flow)
  - Proper logging of errors for monitoring

- **Type Safety:**
  - Updated TypeScript interfaces to include new fields
  - Proper type checking throughout the implementation

- **Extensibility:**
  - The implementation allows for future enhancements like SMS notifications
  - Email status tracking provides a foundation for more sophisticated notification systems

#### Current Status:
- EmailService is fully integrated with coaching API routes
- Email notifications are sent when coaching sessions are scheduled
- Email notifications are sent when coaching prompts are dismissed
- Email status is tracked and returned to the client
- UI provides feedback about email delivery status
- Environment variables updated to match email service provider requirements

#### Expected Outcome:
- ✅ Functional email notification system integrated with coaching workflow
- ✅ Working scheduling prompt for coaching calls with email notifications
- ✅ Successful delivery of workbook submissions to coaching team
- ⏳ Complete database integration for storing coaching sessions and dismissals (pending)

---

### Milestone 4: Worksheet Authentication Fix (COMPLETED)
**Goal:** Resolve persistent 401 Unauthorized errors in the worksheet recommendations API

#### Tasks:
- [x] Fix authentication token forwarding in web app proxy routes
- [x] Update server API routes to accept authentication via headers
- [x] Improve error handling and logging for authentication failures
- [x] Ensure consistent session handling across all worksheet API routes
- [x] Fix TypeScript errors in API routes

#### Implementation Details:

##### 1. Server-Side Authentication Enhancement

**API Routes Authentication:**
- Updated server-side worksheet recommendations and relationships routes to accept authentication via multiple methods:
  - Primary: NextAuth's `getServerSession()` for direct server access
  - Secondary: Custom header authentication (`Authorization`, `x-user-id`, `x-user-email`) for proxy requests
- Added detailed logging for authentication failures to aid debugging
- Fixed TypeScript errors related to null handling in user email validation
- Ensured consistent error response format across all API routes

##### 2. Web App Proxy Routes

**Proxy Authentication Forwarding:**
- Enhanced proxy routes to correctly forward authentication information:
  - Added `Authorization` header with Bearer token from session
  - Included `x-user-id` and `x-user-email` headers for direct user identification
  - Set `cache: 'no-store'` to prevent stale data issues
  - Added `export const dynamic = 'force-dynamic';` to ensure dynamic rendering

##### 3. Client-Side React Query Hooks

**Authentication-Aware Data Fetching:**
- Improved React Query hooks to properly handle authentication state
- Added explicit session checks before making API calls
- Enhanced error handling for 401/403 responses
- Added support for non-JSON error responses

#### Current Status:
- Authentication now works correctly across all worksheet API routes
- Proper error handling and logging in place for debugging
- TypeScript errors fixed in all related files
- Consistent authentication pattern established for future API routes

#### Expected Outcome:
- ✅ Elimination of 401 Unauthorized errors in worksheet recommendations
- ✅ Proper authentication token forwarding between web and server apps
- ✅ Improved error handling and debugging capabilities
- ✅ Type-safe implementation with proper TypeScript support

---

### Milestone 5: Worksheet Relationship Model (COMPLETED)
**Goal:** Establish connections between pillar worksheets and follow-up worksheets

#### Tasks:
- [x] Design `WorksheetRelationship` data model
- [x] Update MongoDB schema to include relationship tracking
- [x] Create API endpoints for retrieving related worksheets
- [x] Implement server-side logic to map relationships
- [x] Add client-side hooks to fetch related worksheets

#### Implementation Details:

##### 1. Data Model

**WorksheetRelationship Model (`/apps/server/src/models/WorksheetRelationship.ts`):**
- Created a comprehensive model with the following key features:
  - Relationship types (follow-up, prerequisite, recommended, related, jackier-method)
  - Trigger conditions (completion, score-threshold, time-elapsed, specific-answer, ai-recommendation)
  - Relevance scoring system (1-100) to prioritize recommendations
  - Context descriptions to explain relationships to users
  - Display ordering for UI presentation

##### 2. Server-Side Implementation

**WorksheetRelationshipService (`/apps/server/src/services/worksheetRelationshipService.ts`):**
- Implemented CRUD operations for worksheet relationships
- Created methods for retrieving relationships by source or target worksheet
- Added specialized methods for getting recommended follow-ups based on user data
- Integrated with the existing worksheet loader system

**API Endpoints:**
- `/api/worksheets/relationships` - For managing and retrieving worksheet relationships
- `/api/worksheets/recommendations` - For getting personalized worksheet recommendations

##### 3. Client-Side Integration

**React Query Hooks (`/apps/web/src/hooks/useWorksheetRelationships.ts`):**
- Created `useWorksheetRelationships` hook for fetching relationship data
- Implemented `useWorksheetRecommendations` hook for personalized recommendations
- Added proper TypeScript interfaces and error handling

**UI Components:**
- Created `WorksheetRecommendations` component to display personalized recommendations
- Added visual indicators for relationship types (follow-up, prerequisite, etc.)
- Implemented responsive card layout for recommendation display

##### 4. Data Seeding

**Seed Script (`/apps/server/src/scripts/seedWorksheetRelationships.ts`):**
- Created a script to establish initial relationships between:
  - Pillar worksheets and their follow-ups
  - Jackier Method steps and implementation support follow-ups
  - Jackier Method steps and relevant pillar worksheets
- Added contextual descriptions for each relationship

#### Current Status:
- Complete data model for worksheet relationships
- Functional APIs for managing and retrieving relationships
- Client-side hooks and components for displaying recommendations
- Ready for integration with the user journey

#### Expected Outcome:
- ✅ Database structure for tracking worksheet relationships
- ✅ Functional API for retrieving related worksheets
- ✅ Client-side capability to understand worksheet connections

---

### Milestone 6: Contextual Recommendations
**Goal:** Enhance the recommendation system to provide context-aware follow-up suggestions

#### Tasks:
- [ ] Extend the AI prompt to analyze specific user challenges
- [ ] Create mapping logic between challenges and appropriate worksheets
- [ ] Implement storage for recommendation context
- [ ] Update diagnosis UI to display contextual explanations
- [ ] Test recommendation accuracy with sample user data

#### Expected Outcome:
- AI-powered contextual worksheet recommendations
- Clear explanations for why each worksheet is recommended
- Improved user understanding of their development path

---

### Milestone 7: Progress Tracking Visualization
**Goal:** Create a visual representation of the user's leadership journey

#### Tasks:
- [ ] Design the leadership journey map UI component
- [ ] Create `UserProgress` data model
- [ ] Implement API endpoints for progress data
- [ ] Build client-side visualization components
- [ ] Add progress indicators and achievement markers

#### Expected Outcome:
- Visual leadership journey map on user dashboard
- Clear indication of completed and pending worksheets
- Visual connections between related worksheets

---

### Milestone 7: Reflection Features
**Goal:** Implement features that connect previous worksheet answers to follow-up worksheets

#### Tasks:
- [ ] Create API endpoint for retrieving related submissions
- [ ] Build UI components to display previous worksheet insights
- [ ] Implement storage and retrieval of key insights
- [ ] Create reflection prompts based on previous answers
- [ ] Add progress self-assessment features

#### Expected Outcome:
- Follow-up worksheets that reference previous answers
- Reflection prompts that build on prior insights
- Seamless connection between worksheet experiences

---

### Milestone 8: Intelligent Follow-up Timing
**Goal:** Create a system that suggests follow-up worksheets at optimal times

#### Tasks:
- [ ] Design notification scheduling system
- [ ] Implement algorithm for determining optimal timing
- [ ] Create reminder mechanism (in-app and/or email)
- [ ] Add user preferences for notification frequency
- [ ] Test notification delivery and timing

#### Expected Outcome:
- Timely follow-up worksheet suggestions
- Personalized notification system
- Improved user engagement with follow-up worksheets

---

### Milestone 9: Adaptive Content System
**Goal:** Create worksheets that adapt based on user's previous responses

#### Tasks:
- [ ] Extend AI integration for dynamic worksheet generation
- [ ] Implement logic to filter and prioritize questions
- [ ] Create difficulty adjustment based on user mastery
- [ ] Design adaptive prompts referencing specific challenges
- [ ] Test adaptive content with various user profiles

#### Expected Outcome:
- Worksheets that adapt to user's skill level and needs
- More efficient learning experience
- Increased relevance of worksheet content

---

### Milestone 10: Enhanced Coaching Integration
**Goal:** Create seamless transitions between self-guided worksheets and coaching

#### Tasks:
- [ ] Add coaching request fields to follow-up worksheets
- [ ] Create `CoachingTouchpoint` model
- [ ] Implement "Request Coaching Session" workflow
- [ ] Build system to package worksheet responses for coaching context
- [ ] Design coach dashboard for viewing user progress

#### Expected Outcome:
- Natural integration points between worksheets and coaching
- Context-rich coaching requests
- Improved coaching effectiveness through worksheet data

---

### Milestone 10: Testing & Optimization
**Goal:** Ensure all new features work together seamlessly and perform well

#### Tasks:
- [ ] Perform comprehensive integration testing
- [ ] Conduct user experience testing
- [ ] Optimize performance of data-intensive features
- [ ] Fix identified bugs and issues
- [ ] Document the enhanced system

#### Expected Outcome:
- Stable, high-performing follow-up worksheet system
- Seamless user experience across all features
- Well-documented system for future maintenance

## Progress Tracking

We will update this document after completing each milestone, noting:
- Completion date
- Any deviations from the plan
- Lessons learned
- Adjustments to subsequent milestones

## Dependencies and Risks

- **AI Integration:** Enhanced AI prompts depend on the existing AI integration infrastructure
- **Data Consistency:** Ensuring consistent data patterns across the application
- **Performance:** Monitoring performance impact of additional data relationships and queries
- **User Experience:** Balancing feature richness with simplicity and clarity
