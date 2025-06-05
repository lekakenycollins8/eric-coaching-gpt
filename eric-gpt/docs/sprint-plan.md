# Sprint Plan & Progress
After each sprint, update the Status column to ✅ Done or 🟢 In Review.

| Sprint | Dates             | Goals                              | Status       |
|--------|-------------------|------------------------------------|--------------|  
| 0      | Apr 30 - May 6    | Core infra in place                | ✅ Done      |
| 1      | May 7 - May 13    | Secure login and subscription system | ✅ Done      |
| 2      | May 14 - May 20   | Dashboard UI and worksheet system  | ✅ Done      |
| 3      | May 21 - May 27   | Custom GPT integration for coaching feedback | ✅ Done      |
| 4      | May 28 - June 3   | PDF Export & Quota Enforcement UI  | ✅ Done      |
| 5      | June 4 - June 17  | My Submissions & Trackers/Reflection Tools | 🟢 In Progress |

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
- Removed the detailed submission view page in favor of direct PDF access

### In Progress: Trackers & Reflection Tools

#### 1. Database Models (Planned)
- TrackerPeriod: Overall 5-day tracking period linked to worksheet commitments
- TrackerEntry: Daily tracking entries with progress data and notes
- TrackerReflection: Final reflection after the 5-day period

#### 2. API Endpoints (Planned)
- Create Tracker: Start a new 5-day tracker linked to a worksheet submission
- Get User Trackers: List all trackers for the current user
- Get Tracker Details: Get a specific tracker with its entries and reflection
- Add/Update Entry: Add or update a daily tracker entry
- Add/Update Reflection: Add or update the final reflection
- Generate PDF: Create a PDF summary of the tracker

#### 3. Frontend Components (Planned)
- Tracker List: View all active and completed trackers
- Tracker Creation: Start a new tracker from a worksheet commitment
- Daily Entry Form: Log progress for each day
- Final Reflection Form: Submit overall reflection
- Tracker Detail View: See all entries and reflection for a tracker
- PDF Export: Generate and download a PDF summary

### Deliverables
- ✅ Users can view and revisit their past worksheet submissions via the "My Submissions" page
- ✅ Users can directly view and download PDFs of their past submissions
- 🔄 Fully functional 5-day tracker flow, linkable to worksheet commitments (in progress)
- 🔄 Consolidated tracker PDF export (in progress)
- 🔄 Passing E2E tests for submissions viewing and tracker functionality (in progress)