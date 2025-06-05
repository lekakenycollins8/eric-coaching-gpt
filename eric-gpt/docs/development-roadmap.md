# Eric GPT Coaching Platform Development Roadmap

## Sprint 0: Project Initialization

### Dates: Apr 30 – May 6

### Goals: Core infrastructure setup and Windsurf integration

### Tasks

* Create GitHub repo and enable Issues + Projects board for task tracking
* Scaffold a Next.js app using TypeScript, Tailwind CSS, ESLint, Prettier
* Install and configure required dependencies:
  - `next-auth` for authentication with magic link
  - `nodemailer` for email delivery
  - `stripe` for billing
  - `openai` for GPT integration
  - `react-hook-form` for dynamic forms
  - `puppeteer` for PDF generation
* Setup `.env` and secure environment variable management in Vercel
* Connect Windsurf AI with repo and set up workspace index
* Deploy staging environment to Vercel

### Deliverables

* Cleanly bootstrapped Next.js app deployed on staging
* All critical tools installed and wired
* Vercel hosting and environment ready for future sprints
* Windsurf properly integrated with doc and source files indexed

---

## Sprint 1: Authentication & Billing Integration

### Dates: May 7 – May 13

### Goals: Enable secure user login and enforce subscription-based access

### Tasks

* Implement `next-auth` with magic link login via `nodemailer`
* Build user model in MongoDB with support for subscription metadata (plan, usage, dates)
* Define 6 pricing plans in Stripe (solo/pro/vip – monthly & annual)
* Implement `/api/stripe/create-checkout-session` to initiate billing
* Add Stripe webhook handler at `/api/stripe/webhook` to update user subscription status in DB
* Display current plan & quota usage on the `/profile` route
* Secure auth routes, session token persistence, and verify redirect flow
* Write unit tests for auth API routes, Stripe event handling, and DB updates

### Deliverables

* Fully functioning login/signup with magic link
* Stripe payments working end-to-end with live webhooks
* Plans reflected on frontend with user subscription + quota data
* Unit tests for all auth and billing logic

---

## Sprint 2: Worksheet Metadata & Dynamic Forms

### Dates: May 14 – May 20

### Goals: Render all 12 Pillars worksheets as dynamic interactive forms

### Tasks

* Upload finalized `worksheets.json` file derived from Pillar 1–12 content
* Create `/api/worksheets` endpoint to serve worksheet metadata from local JSON or MongoDB
* Build `WorksheetForm.tsx` component to render all fields by metadata including:
  - Input types: `text`, `textarea`, `rating`, `checkbox`, etc.
  - Display types: `info` fields for case studies, reflection blocks
* Add support for optional vs required fields
* Use `react-hook-form` to manage state, validation, and form submission
* Ensure instructional fields are rendered using `type: "info"`
* Build logic to ignore `info` fields when submitting data
* Write integration tests to ensure each form renders properly and validates required input

### Deliverables

* All 12 worksheets render cleanly via metadata-driven form engine
* Instructional content blocks included (`info` fields)
* Client-side validation for required inputs
* Integration tests for dynamic field rendering

## Sprint 3: AI Feedback & Prompt QA

### Dates: May 21 – May 27

### Goals: End-to-end GPT feedback with prompt verification

### Tasks

*   Implement /api/submissions with quota middleware
*   Prompt builder using systemPromptKey + user answers
*   Call OpenAI GPT-4 API, save Submission record including tokensUsed
*   Display feedback in FeedbackPanel below form
*   Prompt QA: Create sample answer sets for each worksheet, verify feedback tone/consistency
*   Write unit tests mocking OpenAI responses and error handling

### Deliverables

*   Users submit a form → see AI feedback inline
*   Prompt QA report with any template adjustments
*   100% passing coverage on submission logic tests

## Sprint 4: PDF Export & Quota Enforcement UI

### Dates: May 28 – June 3

### Goals: Downloadable PDFs and visual quota controls

### Tasks

*   Create /pdf-template/[submissionId] page styled with gold/green/silver branding
*   Build /api/submissions/:id/pdf with Puppeteer rendering
*   Add usage meter (“X of Y used”) to form and dashboard
*   Block over-quota submissions with “Upgrade” CTA
*   Write integration tests for PDF endpoint and quota enforcement

### Deliverables

*   “Download PDF” link generates branded PDF
*   Quota meter visible; submissions blocked when limit reached
*   Passing PDF & quota enforcement tests

## Sprint 5: My Submissions Page & Trackers/Reflection Tools

### Dates: June 4 – June 17 (Extended Sprint to accommodate new scope)

### Goals: 
1. Enable users to view their past worksheet submissions.
2. Implement 5-day trackers with autosave + manual save, linkable to worksheet commitments.

### Tasks

**Part 1: 'My Submissions' Page** ✅
*   ✅ Backend: Leveraged existing API endpoint to fetch all of a user's worksheet submissions (ID, title, date).
*   ✅ Backend: Confirmed existing endpoint to fetch full submission details is robust.
*   ✅ Frontend: Added 'My Submissions' navigation link to dashboard sidebar.
*   ✅ Frontend: Created page to list all user submissions with pagination.
*   ✅ Frontend: Implemented direct PDF viewing and downloading for submissions.

**Part 2: Trackers & Reflection Tools**
*   Backend: Define Mongoose models for `TrackerPeriod`, `TrackerEntry`, `TrackerReflection`.
*   Backend: API endpoints to create/manage tracker periods, log daily entries, and submit final reflections.
*   Backend: API endpoint to generate a PDF export of a tracker summary.
*   Frontend: UI to start a new tracker (ideally from a worksheet commitment).
*   Frontend: UI for daily tracker entries (5-day view) with autosave.
*   Frontend: UI for submitting the final tracker reflection.
*   Frontend: UI to list and view active/completed trackers.
*   Frontend: 'Download PDF' for tracker summary.
*   End-to-end test: start tracker → log entries → submit reflection → export PDF.

### Deliverables

*   ✅ Users can view and revisit their past worksheet submissions via the "My Submissions" page.
*   ✅ Users can directly view and download PDFs of their past submissions.
*   🔄 Fully functional 5-day tracker flow, linkable to worksheet commitments (in progress).
*   🔄 Consolidated tracker PDF export (in progress).
*   🔄 Passing E2E tests for submissions viewing and tracker functionality (in progress).

## Sprint 6: Pro Team Collaboration

### Dates: June 18 – June 24

### Goals: Org invites, shared usage

### Tasks

*   Org model & schema in DB
*   /api/org/invite endpoint → send email (Nodemailer preferred)
*   Join flow: invite token → new/existing user added to Org
*   Team Settings UI: list members, remove member
*   Tests for invite flow, join logic, shared quota increments

### Deliverables

*   Pro users can invite up to 4 teammates
*   Usage pool shared across Org members
*   Invite workflow tests passing

## Sprint 7: VIP Dashboard & UI/UX Polish

### Dates: June 25 – July 1

### Goals: VIP history view, responsive polish, accessibility

### Tasks

*   VIP “My Submissions” page: table of past submissions + download links
*   Mobile & accessibility improvements per UI/UX spec
*   Add skeleton loaders, error banners, success toasts
*   Cypress E2E tests covering core journeys (signup, subscribe, worksheet, tracker)

### Deliverables

*   Polished UI matching spec, all major flows E2E tested
*   Accessibility audit report (WCAG light)

## Sprint 8: Final QA, Staging & Launch

### Dates: June 25 – July 1

### Goals: Client UAT, docs, production release

### Tasks

*   Deploy staging branch; invite client for UAT
*   Fix any UAT bugs; finalize prompt tone tweaks
*   Write end-user docs: “How to use Eric GPT”
*   Merge main → deploy to production; run smoke tests
*   Set up monitoring (Sentry, Vercel Analytics, Stripe alerts)

### Deliverables

*   Live Eric GPT Coaching Platform in production
*   Completed documentation & client walkthrough
*   Monitoring dashboards live