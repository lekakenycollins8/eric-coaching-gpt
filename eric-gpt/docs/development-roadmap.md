# Eric GPT Coaching Platform Development Roadmap

## Sprint 0: Project Initialization

### Dates: Apr 30 – May 6

### Goals: Core infra in place, Windsurf connected

### Tasks

*   Create GitHub repo & project board
*   Scaffold Next.js + TypeScript + Tailwind + ESLint/Prettier
*   Install dependencies: NextAuth, Stripe, OpenAI SDK, React Hook Form, Puppeteer
*   Configure environment variables in Vercel (MONGODB_URI, NEXTAUTH_SECRET, STRIPE_SECRET_KEY, OPENAI_API_KEY, MAILGUN_API_KEY)
*   Connect Windsurf IDE with repo
*   Write “Hello World” smoke test in CI to verify pipeline

### Deliverables

*   Barebones Next.js project deployed to staging
*   Passing CI “hello world” test

## Sprint 1: Authentication & Billing Integration

### Dates: May 7 – May 13

### Goals: Secure login and subscription system

### Tasks

*   NextAuth.js email/magic-link setup; User model in MongoDB
*   Stripe plan definitions (solo/pro/vip monthly & annual) in code
*   /api/stripe/create-checkout-session & webhook handler (/api/stripe/webhook)
*   Profile page skeleton displaying plan & usage placeholders
*   Unit tests for Auth routes and Stripe webhook logic

### Deliverables

*   Users can sign up/in and start a subscription
*   Webhook correctly updates User.subscription in DB
*   All Auth + Billing unit tests passing

## Sprint 2: Worksheet Metadata & Dynamic Forms

### Dates: May 14 – May 20

### Goals: Render forms for the first 4 worksheets

### Tasks

*   Load /data/worksheets.json into /api/worksheets endpoints
*   Build WorksheetForm component to render fields by metadata
*   Client-side validation for required fields
*   Integration test: fetch metadata → render form → validate error states

### Deliverables

*   Four working worksheet forms (Pillars 1–4) with validation
*   Automated integration test for form rendering

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

## Sprint 5: Pro Team Collaboration

### Dates: June 4 – June 10

### Goals: Org invites, shared usage

### Tasks

*   Org model & schema in DB
*   /api/org/invite endpoint → send email via Mailgun
*   Join flow: invite token → new/existing user added to Org
*   Team Settings UI: list members, remove member
*   Tests for invite flow, join logic, shared quota increments

### Deliverables

*   Pro users can invite up to 4 teammates
*   Usage pool shared across Org members
*   Invite workflow tests passing

## Sprint 6: Trackers & Reflection Tools

### Dates: June 11 – June 17

### Goals: 5-day trackers with autosave + manual save

### Tasks

*   /api/trackers and /api/trackers/:id/start → create TrackerPeriod
*   Render 5 date rows with promptFields; implement autosave on blur + “Save” button
*   /entries and /reflection endpoints, plus /export PDF of tracker summary
*   UI reveal logic for reflectionFields after 5 entries
*   End-to-end test: start tracker → log entries → submit reflection → export PDF

### Deliverables

*   Fully functional 5-day tracker flow
*   Consolidated tracker PDF export
*   Passing tracker E2E test

## Sprint 7: VIP Dashboard & UI/UX Polish

### Dates: June 18 – June 24

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