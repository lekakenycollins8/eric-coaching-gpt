# Technical Analysis: Eric GPT Coaching Platform
## Date: April 30, 2025

### 1. Architecture & Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js (React + TypeScript) | Component-driven UI, server-side rendering, fast navigation |
| Styling | Tailwind CSS, Shadcn | Utility-first, consistent design, rapid UI development |
| Forms & State | React Hook Form | Declarative, performant form management and validation |
| Auth | NextAuth.js (+ Nodemailer magic-link) | Secure email login, session management |
| API Layer | Next.js API Routes | Unified serverless functions for business logic |
| Database | MongoDB Atlas | Flexible document storage for users, submissions, trackers |
| AI | OpenAI GPT-4 API | Chat-completion engine for personalized coaching feedback |
| Billing | Stripe (Checkout & Webhooks) | Subscription management, plan enforcement |
| PDF Export | Puppeteer (serverless) | Render HTML to branded PDF for downloads |
| Email | Nodemailer | Magic-link delivery, system notifications |
| Deployment | Vercel | Automatic CI/CD, environment management, global CDN |
| Monitoring | Sentry, Vercel Analytics | Error tracking, performance monitoring |

### 2. Core Components & Data Flows

#### Authentication & Sessions

NextAuth.js handles email magic-links via Nodemailer.

Session JWTs include user ID and subscription state.

#### Subscription Middleware

On each submission endpoint, middleware verifies plan quotas (10/40/).

Stripe webhooks update user subscription records in MongoDB.

#### Worksheet Forms

Metadata-driven rendering from JSON.

Client-side validation ensures data integrity before API call.

#### AI Feedback Pipeline

Server builds prompt: merges system templates + user answers.

Calls OpenAI GPT-4 (temperature=0.7, max_tokens=800).

Parses response, persists feedback and tokensUsed.

#### PDF Generation

Dedicated hidden route renders React component for Puppeteer.

On request, Puppeteer generates PDF stream with branding.

#### Trackers Module

Tracker definitions (5-day cycles) create periods.

Daily entry saving (auto + manual) and final reflections.

Consolidated PDF export via same Puppeteer flow.

#### Team Collaboration

Org model links users to shared subscription and quota.

Invite tokens allow secure onboarding into an Org.

### 3. Risk Assessment & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| API Cost Overrun | Increased monthly bills | Enforce token limits, monitor usage metrics, cap per-user |
| AI Hallucinations | Off-brand or incorrect feedback | Rigorous prompt templates, prompt QA with real examples |
| OCR / Upload Complexity (Deferred) | Not applicable | N/A (we removed PDF upload) |
| Quota Bypass or Race Conditions | Unauthorized usage | Atomic DB updates, strong middleware checks |
| Email Delivery Failures | Login/notifications broken | Use Nodemailer’s delivery analytics, fallback retry logic |
| PDF Rendering Flakiness | Inconsistent PDFs | Pre-test Puppeteer templates, version-lock Chromium |
| Scalability Under Load | Slow response times | Vercel autoscaling, Edge caching for static assets |

### 4. Performance & Scalability

* Frontend: Static pages and assets served via Vercel’s CDN.
* API: Serverless functions scale on demand; heavy GPT calls are I/O-bound.
* Database: MongoDB Atlas scales reads/writes; index frequently queried fields (userId, periodId).
* Caching:
	+ Cache worksheet metadata and prompt templates in-memory.
	+ Consider Redis or Edge caching for usage stats if read-heavy.