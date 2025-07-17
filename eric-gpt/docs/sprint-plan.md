# Sprint Plan & Progress
After each sprint, update the Status column to ✅ Done or 🟢 In Review.

| Sprint | Dates             | Goals                              | Status       |
|--------|-------------------|------------------------------------|--------------|  
| 0      | Apr 30 - May 6    | Core infra in place                | ✅ Done      |
| 1      | May 7 - May 13    | Secure login and subscription system | ✅ Done      |
| 2      | May 14 - May 20   | Dashboard UI and worksheet system  | ✅ Done      |
| 3      | May 21 - May 27   | Custom GPT integration for coaching feedback | ✅ Done      |
| 4      | May 28 - June 3   | PDF Export & Quota Enforcement UI  | ✅ Done      |
| 5      | June 4 - June 17  | Trackers & Team Collaboration      | ✅ Done      |
| 6      | July 20 - Aug 3   | Jackier Method Workbook Integration | 🟡 Planned   |

## Sprint 6: Jackier Method Workbook Integration

**Status:** Planned
**Timeline:** July 20 - August 3, 2025

### Goals
- Implement mandatory Jackier Method Workbook assessment
- Create AI diagnosis engine for leadership pillar identification
- Integrate human coaching handoff with email notifications
- Develop follow-up assessment system

### Implementation Phases

#### Phase 1: Data Models & Core Backend (Days 1-3)
- [ ] Create MongoDB models for Workbook, WorkbookSubmission, and FollowupAssessment
- [ ] Convert Jackier Method Workbook content to structured JSON format
- [ ] Implement basic API endpoints for workbook retrieval
- [ ] Add subscription checks for workbook access
- [ ] Set up database seeding for initial workbook content

#### Phase 2: Workbook UI & Progress Saving (Days 4-7)
- [ ] Design multi-section workbook UI with progress tracking
- [ ] Implement auto-save functionality for partial progress
- [ ] Create form validation for required fields
- [ ] Add "Save & Continue Later" and "Submit" functionality
- [ ] Implement workbook status indicators on dashboard

#### Phase 3: AI Diagnosis Engine (Days 8-10)
- [ ] Develop GPT-4 prompt for leadership pillar diagnosis
- [ ] Create analysis logic to identify primary leadership pillars
- [ ] Implement worksheet recommendation algorithm
- [ ] Build diagnosis results visualization dashboard
- [ ] Add PDF generation for diagnosis results

#### Phase 4: Email & Human Coaching Integration (Days 11-12)
- [ ] Build email notification system using Nodemailer
- [ ] Create HTML email template for workbook submissions
- [ ] Implement prompt for scheduling calls with Eric
- [ ] Add contact page link integration
- [ ] Test email delivery to help@jackiercoaching.com

#### Phase 5: Follow-up System & Final Integration (Days 13-15)
- [ ] Implement follow-up assessment system
- [ ] Create notification mechanism for follow-up worksheets
- [ ] Build follow-up assessment UI
- [ ] Integrate with existing worksheet system
- [ ] Perform comprehensive testing and bug fixes

### Environment Variables
- `NEXT_PUBLIC_APP_URL`: Web app URL (client-facing)
- `NEXT_PUBLIC_API_URL`: API server URL
- `EMAIL_SERVER_HOST`: SMTP server for email notifications
- `EMAIL_SERVER_PORT`: SMTP port
- `EMAIL_SERVER_USER`: SMTP username
- `EMAIL_SERVER_PASSWORD`: SMTP password
- `EMAIL_FROM`: Sender email address
- `COACHING_TEAM_EMAIL`: help@jackiercoaching.com

### Deliverables
- Complete Jackier Method Workbook assessment system
- AI diagnosis engine with worksheet recommendations
- Email integration with coaching team
- Follow-up assessment and adaptive recommendation system
- PDF export of diagnosis results

## Sprint 1 Completed Work

### Authentication System
- Implemented NextAuth.js with email/magic link authentication
- Configured MongoDB session store
- Fixed hydration errors in authentication UI

### Stripe Integration
- Created server-side API for checkout sessions
- Implemented webhook handler for subscription events
- Added customer portal for subscription management
- Defined subscription plans (Solo, Pro, VIP tiers)
- Implemented client-side utilities for checkout flow

### Architecture Improvements
- Established clear separation between server and web apps
- Centralized plan definitions on server side
- Implemented proper error handling and validation

## Sprint 2 Completed Work

### Dashboard UI
- Created responsive dashboard layout with sidebar navigation
- Implemented mobile-friendly design with collapsible sidebar
- Added navigation links to key sections (Dashboard, Profile, Subscription, Worksheets, Settings)
- Designed subscription management page showing current plan details and available options
- Integrated with Stripe Customer Portal for subscription management

### Worksheet System
- Implemented dynamic worksheet form system with JSON-based configuration
- Created modular field components for different input types:
  - Text input
  - Textarea
  - Rating scales
  - Checkboxes
  - Multi-select options
  - Informational fields
- Added draft saving functionality with localStorage
- Implemented server-side API endpoints for worksheets
- Created worksheet listing page organized by leadership pillars
- Added form validation and error handling
- Implemented UI for displaying AI feedback on worksheet submissions

### UI/UX Improvements
- Integrated shadcn/ui components for consistent styling
- Added loading states with skeleton UI
- Implemented toast notifications for user feedback
- Created responsive layouts for all pages

## Sprint 3 Completed Work: Custom GPT Integration

### OpenAI API Integration
- Set up OpenAI API client with proper authentication in `openai.ts`
- Implemented environment configuration for API keys and model settings
- Created a service layer for making API calls with error handling and retries
- Added comprehensive logging for API calls to track usage and diagnose issues

### Custom GPT Configuration
- Defined the custom GPT model parameters and configuration
- Created a modular prompt system with separate files for each leadership pillar
- Implemented prompt templates that incorporate user worksheet responses
- Set up a configuration system to manage and version prompt templates

### Submission API Development
- Created `/api/submissions` endpoint with quota middleware
- Implemented submission storage in MongoDB with proper schema
- Added tracking for token usage and quota consumption per user
- Implemented authentication and authorization checks for submissions

### Quota Management
- Implemented quota limits based on subscription tiers (Solo, Pro, VIP)
- Created middleware to check and enforce quota limits
- Added quota reset functionality based on billing cycles
- Implemented quota usage tracking and reporting

### Feedback Display
- Enhanced the worksheet submission UI to display AI feedback
- Added loading states during API calls
- Implemented error handling for failed API calls
- Created a FeedbackPanel component to display formatted coaching advice

### Bug Fixes and Improvements
- Fixed critical issue with worksheet submissions by aligning data sources
- Ensured worksheets are read from JSON file consistently across the application
- Added better error logging to help diagnose similar issues
- Updated worksheet ID patterns in the prompt selection logic
- Fixed OpenAI parameter naming from camelCase to snake_case

## Sprint 4 Completed Work: PDF Export & Quota Enforcement UI

### PDF Export Implementation
- Created a PDF template page at `/pdf-template/[submissionId]` with branded styling
- Implemented `/api/submissions/:id/pdf` endpoint using Puppeteer for PDF generation
- Added download functionality to the worksheet submission page
- Ensured PDF includes both user responses and AI feedback in a well-formatted layout

### Quota Enforcement UI
- Added usage meter showing current usage vs. limit ("X of Y used") to dashboard
- Implemented visual indicators on the worksheet form for remaining submissions
- Created blocking UI for over-quota submissions with upgrade call-to-action
- Added quota information to the user profile page

### Testing & Quality Assurance
- Wrote integration tests for the PDF generation endpoint
- Tested quota enforcement UI across different subscription tiers
- Verified PDF formatting across different worksheet types
- Tested edge cases like very long responses and special characters

## Sprint 5 Progress: My Submissions & Trackers/Reflection Tools

### Objective
Enable users to view their past worksheet submissions and implement 5-day trackers with autosave + manual save, linkable to worksheet commitments.

### Completed Work: My Submissions Page
- Added "My Submissions" navigation link to the dashboard sidebar
- Created a paginated submissions list page that displays all user submissions
- Implemented direct PDF viewing and downloading for submissions
- Leveraged existing backend API endpoints for fetching submission data
- Added responsive pagination controls for navigating through submission history
- Implemented empty state UI with call-to-action to complete worksheets

### Completed Work: Trackers & Reflection Tools

#### 1. Database Models
- ✅ Tracker: Core model for 5-day tracking periods with title, description, and status
- ✅ TrackerEntry: Daily tracking entries with completion status and notes for each day
- ✅ TrackerReflection: Final reflection after the 5-day period with content field
- ✅ Added proper MongoDB indexes for optimized queries

#### 2. API Endpoints
- ✅ GET/POST /api/trackers: List all trackers and create new trackers
- ✅ GET/PUT/DELETE /api/trackers/[id]: Get, update, and delete specific trackers
- ✅ GET/POST /api/trackers/[id]/entries: Get all entries and add/update daily entries
- ✅ GET/POST /api/trackers/[id]/reflection: Get and add/update final reflection
- ✅ GET /api/trackers/[id]/pdf: Generate PDF summary of tracker with entries and reflection

#### 3. Frontend Components
- ✅ Tracker List: View all active and completed trackers with filtering
- ✅ Tracker Creation: Start a new tracker with optional link to worksheet submission
- ✅ Daily Entry Form: Log progress for each day with completion status and notes
- ✅ Final Reflection Form: Submit overall reflection on the 5-day tracking period
- ✅ Tracker Detail View: See all entries and reflection for a tracker
- ✅ PDF Export: Generate and download a PDF summary of tracker progress

#### 4. User Experience Features
- ✅ Auto-save functionality for tracker entries and reflections
- ✅ Status management (active, completed, abandoned) with visual indicators
- ✅ Automatic status updates when all entries are completed
- ✅ Mobile-responsive design for all tracker components
- ✅ Loading states with skeleton UI for better user experience

### Deliverables
- ✅ Users can view and revisit their past worksheet submissions via the "My Submissions" page
- ✅ Users can directly view and download PDFs of their past submissions
- ✅ Fully functional 5-day tracker flow, linkable to worksheet commitments
- ✅ Consolidated tracker PDF export with all entries and reflection
- ✅ Comprehensive API with proper authentication and validation