**Eric GPT Coaching Platform — Comprehensive Specification Guide**

**Prepared By:** \[Your Name]
**Date:** April 30, 2025

---

## 1. Feature Specifications Guide

### 1.1 Worksheet Selection

* **Landing Page:** Displays cards for each worksheet (Pillars 1–12) and trackers. Cards show title, pillar number, brief description.
* **Metadata Fetch:** `GET /api/worksheets` returns array of Worksheet objects (fields, labels, types).
* **Detail View:** `/worksheets/:id` loads details via `GET /api/worksheets/:id` and renders dynamic form fields.
* **Form Components:** Built with React Hook Form, matching field definitions (`text`, `textarea`, `checkbox`, `multiselect`, `rating`, `table`).
* **Validation:** Required fields enforced; inline error messages.

### 1.2 AI Feedback Generation

* **Submit Action:** On form submit, collect `answers` JSON and `worksheetId`, send `POST /api/submissions`.
* **Quota Check:** Middleware verifies user’s `submissionsThisPeriod` vs plan limits, returning 403 with upgrade message if exceeded.
* **Prompt Assembly:** On server, load `systemPrompt` from `prompts.json` using `systemPromptKey`, format user answers, and build chat messages.
* **OpenAI API Call:** Send `createChatCompletion` with model `gpt-4`, temperature `0.7`, max\_tokens `800`.
* **Response Handling:** Extract feedback text, record `usage` tokens, save Submission record.

### 1.3 Feedback Delivery

* **On-Screen Display:** Return `{ submissionId, feedback }`. UI shows feedback in styled container below form, with scrolling.
* **Downloadable PDF:** Link `GET /api/submissions/:id/pdf` triggers server-side Puppeteer rendering of `/pdf-template/:id`, returns PDF stream with header (logo + title), feedback body, footer (colors: gold, green, silver).
* **Email Notification:** Optionally send email via Mailgun with PDF attachment (in Phase 2, or admin triggered).

### 1.4 Subscription & Quota Management

* **Subscription Plans:** Solo (10/month), Pro (40/month, Org), VIP (unlimited).
* **Profile Page:** Shows `planId`, `submissionsThisPeriod`, `periodEnd`, `Manage Subscription` (Stripe portal).
* **Quota UI:** On forms, display “X of Y submissions used this month.”
* **Upgrade Flow:** When quota exceeded or via button, redirect to `create-checkout-session` and Stripe portal.

### 1.5 Team Collaboration (Pro Builder)

* **Org Creation:** On Pro sign-up, create Org with ownerId.
* **Invite Flow:** Owner enters teammate email → send invite link → on signup, affiliate user to Org.
* **Shared Quota:** Org’s `submissionsThisPeriod` increments across members.
* **Team Settings:** Profile > Team shows members list, invite form, remove option.

### 1.6 Trackers & Reflection Tools

* **5-Day Period Tools:** Daily Mindset Reset, Self-Belief Tracker, etc.
* **Start Period:** `POST /api/trackers/:id/start` returns `periodId`, `startDate`.
* **Daily Entries:** UI renders 5 date rows with promptFields. Autosave on blur + manual Save button calls `POST /entries`.
* **Final Reflection:** After 5 entries, show reflectionFields; submit `POST /reflection`.
* **Export Report:** `GET /api/trackers/periods/:id/export` downloads compiled PDF.

---

## 2. UI/UX Specification Document

### 2.1 User Journeys

1. **New User Onboarding:** Landing → Sign Up (magic link) → Pricing → Subscribe → Dashboard.
2. **Worksheet Completion:** Dashboard → Select Worksheet → Fill Form → Submit → View Feedback → Download PDF.
3. **Team Setup (Pro):** Dashboard → Team Settings → Invite Teammate → Teammate Onboards → Shared Access.
4. **Tracker Flow:** Dashboard → Select Tracker → Start 5-Day Period → Daily Entry → Final Reflection → Export.
5. **Subscription Management:** Profile → View Plan & Usage → Manage Subscription (Stripe Portal).

### 2.2 Page Layouts & Navigation

* **Nav Bar (Authenticated):** Home, Worksheets, Trackers, Dashboard, Profile, Logout.
* **Nav Bar (Guest):** Home, Worksheets, Pricing, Sign Up / Login.
* **Dashboard:** Welcome banner, usage meter, quick links.
* **Worksheets List:** Responsive grid of cards.
* **Worksheet Form:** Title, description, dynamic form, submit, feedback container.
* **Tracker Page:** Tabbed sections for Entries & Reflection, date-based rows.
* **Profile & Team:** Plan details, usage, team member list, invite form.
* **VIP Submissions:** Table with date, worksheet, download link.

### 2.3 Branding & Style

* **Colors:** Gold accents (#FFD700), Green highlights (#008000), Silver elements (#C0C0C0).
* **Typography:** Inter for headings, Lato for body.
* **Buttons & Forms:** Soft shadows, rounded corners (2xl), consistent padding.
* **Feedback Panel:** Card layout, clear hierarchy, printing-friendly styles.

---

## 3. Technical Design & Module Interaction

### 3.1 High-Level Modules

1. **Frontend (Next.js)**

   * **Pages:** `/`, `/worksheets`, `/worksheets/[id]`, `/trackers`, `/trackers/period/[id]`, `/profile`, `/dashboard`.
   * **Components:** `WorksheetForm`, `TrackerTable`, `FeedbackPanel`, `SubscriptionMeter`, `TeamInvite`.
2. **Backend (Next.js API)**

   * **Auth Module:** NextAuth.js configuration.
   * **Billing Module:** Stripe checkout, webhooks.
   * **Worksheets Module:** Metadata endpoints.
   * **Submissions Module:** Quota enforcement, GPT integration, PDF generation.
   * **Trackers Module:** Period lifecycle, entries, reflections, export.
   * **Database Layer:** MongoDB models & CRUD.

### 3.2 Data Flow

1. **User Action** triggers API call (e.g., Submit Form).
2. **API Route** authenticates session, validates data.
3. **Business Logic** applies (quota check, invite logic).
4. **Integration** with external service (OpenAI or Stripe).
5. **Persistence** in MongoDB.
6. **Response** sent back to frontend.

### 3.3 Error Handling & Logging

* **Client Errors (4xx):** Validation failures, quota exceeded.
* **Server Errors (5xx):** GPT timeouts, Stripe webhook failures.
* **Logging:** Sentry for uncaught exceptions; DB logs for webhook events.

---

## 4. Testing & Deployment Plan

### 4.1 Testing Strategy

* **Unit Tests:** Form validation, API route logic, quota enforcement.
* **Integration Tests:** Simulate end-to-end flow (login → submit → feedback).
* **E2E Tests:** Cypress for UI flows (worksheet, tracker, billing).
* **Performance Tests:** Mock heavy GPT responses, load test submission endpoints.

### 4.2 Testing Milestones

1. **Week 3:** Unit & integration tests for core forms & GPT.
2. **Week 4:** Quota tests, team invite tests.
3. **Week 6:** E2E tests across major user journeys.

### 4.3 Deployment Plan

* **Environment Setup:** Vercel for frontend & API, MongoDB Atlas.
* **Secrets Management:** Vercel Env for API keys (OpenAI, Stripe, Mailgun).
* **CI/CD:** GitHub Actions running tests on PR, auto-deploy to staging.
* **Staging Review:** Deploy branch `staging` for client UAT.
* **Production Release:** Merge `main` → auto-deploy; post-deploy smoke tests.
* **Monitoring:** Sentry + Vercel analytics + Stripe dashboard checks.

---

*This comprehensive guide covers all feature specs, UI/UX, technical design, and testing/deployment workflows. We are now positioned to begin implementation.*